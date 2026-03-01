const Match = require('../models/Match');
const Group = require('../models/Group');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const createMatch = async (req, res, next) => {
    try {
        const { groupId, date, time, venueId, overs, rsvpDeadline } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const match = await Match.create({
            group: groupId,
            date,
            time,
            venue: venueId,
            overs: overs || group.settings.defaultOvers,
            rsvpDeadline: rsvpDeadline || new Date(new Date(date).getTime() - group.settings.rsvpDeadlineHours * 60 * 60 * 1000),
            status: 'rsvp_open',
            createdBy: req.user._id,
            expenses: {
                payments: group.members.map(m => ({
                    player: m.user,
                    amount: 0,
                    paid: false
                }))
            }
        });

        const populatedMatch = await Match.findById(match._id)
            .populate('venue')
            .populate('group', 'name code')
            .populate('createdBy', 'name avatar');

        // Notify group members about the new match
        try {
            const groupWithMembers = await Group.findById(groupId).populate('members.user', 'name email');
            if (groupWithMembers) {
                const recipients = groupWithMembers.members.map(m => m.user?.email).filter(Boolean);
                const subject = `New match scheduled in ${groupWithMembers.name}`;
                const matchLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/groups/${groupId}/matches/${match._id}`;
                const venueName = populatedMatch.venue?.name || '';
                const html = `<p>Hi there,</p>
                    <p>A new match has been scheduled for <strong>${groupWithMembers.name}</strong>.</p>
                    <p><strong>Date:</strong> ${date} <br/>
                    <strong>Time:</strong> ${time} <br/>
                    <strong>Venue:</strong> ${venueName}</p>
                    <p><a href="${matchLink}">View match details</a></p>`;

                await Promise.all(recipients.map(email => sendEmail({ to: email, subject, html }).catch(err => console.error('Match mail error', err))));
            }
        } catch (err) {
            console.error('Failed to send match emails:', err);
        }

        res.status(201).json({
            success: true,
            data: populatedMatch
        });
    } catch (error) {
        next(error);
    }
};

const getMatch = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('venue')
            .populate('group', 'name code members')
            .populate('rsvps.player', 'name avatar playerRole overallRating')
            .populate('teamA.players', 'name avatar playerRole overallRating battingSkill bowlingSkill fieldingSkill')
            .populate('teamB.players', 'name avatar playerRole overallRating battingSkill bowlingSkill fieldingSkill')
            .populate('scorecard.playerOfMatch', 'name avatar')
            .populate('scorecard.battingStats.player', 'name avatar')
            .populate('scorecard.bowlingStats.player', 'name avatar')
            .populate('scorecard.fieldingStats.player', 'name avatar')
            .populate('photos.uploadedBy', 'name avatar')
            .populate('expenses.payments.player', 'name avatar')
            .populate('createdBy', 'name avatar');

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        res.status(200).json({
            success: true,
            data: match
        });
    } catch (error) {
        next(error);
    }
};

const getGroupMatches = async (req, res, next) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;

        const query = { group: req.params.groupId };
        if (status) query.status = status;

        const matches = await Match.find(query)
            .populate('venue', 'name address')
            .populate('rsvps.player', 'name avatar')
            .sort('-date')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Match.countDocuments(query);

        res.status(200).json({
            success: true,
            count: matches.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: matches
        });
    } catch (error) {
        next(error);
    }
};

const getUpcomingMatch = async (req, res, next) => {
    try {
        const match = await Match.findOne({
            group: req.params.groupId,
            status: { $in: ['upcoming', 'rsvp_open', 'teams_set'] },
            date: { $gte: new Date() }
        })
            .populate('venue')
            .populate('rsvps.player', 'name avatar playerRole overallRating')
            .populate('teamA.players', 'name avatar playerRole overallRating')
            .populate('teamB.players', 'name avatar playerRole overallRating')
            .populate('expenses.payments.player', 'name avatar')
            .sort('date');

        res.status(200).json({
            success: true,
            data: match
        });
    } catch (error) {
        next(error);
    }
};

const submitRSVP = async (req, res, next) => {
    try {
        const { status } = req.body; // 'yes', 'no', 'maybe'
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Check if RSVP is still open
        if (match.isRsvpClosed() && match.status !== 'rsvp_open') {
            return res.status(400).json({ success: false, message: 'RSVP deadline has passed' });
        }

        // Update or add RSVP
        const existingRsvpIndex = match.rsvps.findIndex(
            r => r.player.toString() === req.user._id.toString()
        );

        if (existingRsvpIndex > -1) {
            match.rsvps[existingRsvpIndex].status = status;
            match.rsvps[existingRsvpIndex].respondedAt = new Date();
        } else {
            match.rsvps.push({
                player: req.user._id,
                status,
                respondedAt: new Date()
            });
        }

        await match.save();

        const updatedMatch = await Match.findById(match._id)
            .populate('rsvps.player', 'name avatar playerRole overallRating');

        res.status(200).json({
            success: true,
            message: `RSVP updated to ${status}`,
            data: updatedMatch.rsvps
        });
    } catch (error) {
        next(error);
    }
};

const generateTeams = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('rsvps.player', 'name avatar playerRole overallRating battingSkill bowlingSkill fieldingSkill');

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get confirmed players
        const confirmedPlayers = match.rsvps
            .filter(r => r.status === 'yes')
            .map(r => r.player);

        if (confirmedPlayers.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Need at least 4 confirmed players to generate teams'
            });
        }

        // Balance teams using algorithm
        const { teamA, teamB } = balanceTeams(confirmedPlayers);

        match.teamA = {
            name: req.body.teamAName || 'Team Thunder ⚡',
            players: teamA.map(p => p._id),
            totalRating: teamA.reduce((sum, p) => sum + p.overallRating, 0)
        };

        match.teamB = {
            name: req.body.teamBName || 'Team Storm 🌊',
            players: teamB.map(p => p._id),
            totalRating: teamB.reduce((sum, p) => sum + p.overallRating, 0)
        };

        match.status = 'teams_set';
        await match.save();

        const updatedMatch = await Match.findById(match._id)
            .populate('teamA.players', 'name avatar playerRole overallRating battingSkill bowlingSkill fieldingSkill')
            .populate('teamB.players', 'name avatar playerRole overallRating battingSkill bowlingSkill fieldingSkill');

        res.status(200).json({
            success: true,
            data: {
                teamA: updatedMatch.teamA,
                teamB: updatedMatch.teamB,
                balanceDiff: Math.abs(updatedMatch.teamA.totalRating - updatedMatch.teamB.totalRating).toFixed(1)
            }
        });
    } catch (error) {
        next(error);
    }
};

const balanceTeams = (players) => {
    // Sort players by overall rating (descending)
    const sorted = [...players].sort((a, b) => b.overallRating - a.overallRating);

    let teamA = [];
    let teamB = [];
    let ratingA = 0;
    let ratingB = 0;

    // Greedy algorithm: assign each player to the team with lower total rating
    // Also try to balance roles (batsmen, bowlers, allrounders)
    for (const player of sorted) {
        if (ratingA <= ratingB) {
            teamA.push(player);
            ratingA += player.overallRating;
        } else {
            teamB.push(player);
            ratingB += player.overallRating;
        }
    }

    // Role balancing pass
    const roleCount = (team, role) => team.filter(p => p.playerRole === role).length;

    // Try swapping players to balance roles while keeping rating balance
    for (let i = 0; i < teamA.length; i++) {
        for (let j = 0; j < teamB.length; j++) {
            const ratingDiffBefore = Math.abs(ratingA - ratingB);

            const newRatingA = ratingA - teamA[i].overallRating + teamB[j].overallRating;
            const newRatingB = ratingB - teamB[j].overallRating + teamA[i].overallRating;
            const ratingDiffAfter = Math.abs(newRatingA - newRatingB);

            // Swap if it improves role balance without making rating much worse
            if (ratingDiffAfter <= ratingDiffBefore + 5) {
                const bowlersA = roleCount(teamA, 'bowler');
                const bowlersB = roleCount(teamB, 'bowler');

                if (Math.abs(bowlersA - bowlersB) > 1) {
                    if (teamA[i].playerRole === 'bowler' && bowlersA > bowlersB + 1) {
                        [teamA[i], teamB[j]] = [teamB[j], teamA[i]];
                        ratingA = newRatingA;
                        ratingB = newRatingB;
                    }
                }
            }
        }
    }

    return { teamA, teamB };
};

const performToss = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id).populate('rsvps.player', 'name email');

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const winner = Math.random() < 0.5 ? 'teamA' : 'teamB';
        const decision = req.body.decision || (Math.random() < 0.5 ? 'bat' : 'bowl');

        match.toss.winner = winner;
        match.toss.decision = decision; // 'bat' or 'bowl'
        match.status = 'in_progress';
        await match.save();

        const winnerName = winner === 'teamA' ? match.teamA.name : match.teamB.name;

        // Notify confirmed participants about toss result
        try {
            const confirmed = match.rsvps.filter(r => r.status === 'yes').map(r => r.player).filter(Boolean);
            const recipients = confirmed.map(p => p.email).filter(Boolean);
            if (recipients.length > 0) {
                const subject = `Toss result for ${match.group ? match.group : 'your match'}`;
                const matchLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/groups/${match.group}/matches/${match._id}`;
                const html = `<p>Hi,</p>
                    <p>The toss for the match on <strong>${match.date}</strong> has been completed.</p>
                    <p><strong>Winner:</strong> ${winnerName}<br/>
                    <strong>Decision:</strong> ${decision}</p>
                    <p><a href="${matchLink}">View match details</a></p>`;

                await Promise.all(recipients.map(email => sendEmail({ to: email, subject, html }).catch(err => console.error('Toss mail error', err))));
            }
        } catch (err) {
            console.error('Failed to send toss emails:', err);
        }

        res.status(200).json({
            success: true,
            data: {
                winner,
                winnerName,
                decision: match.toss.decision
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateExpenses = async (req, res, next) => {
    try {
        const { totalCost } = req.body;
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const confirmedPlayers = match.rsvps.filter(r => r.status === 'yes');
        const perPerson = Math.ceil(totalCost / confirmedPlayers.length);

        match.expenses.totalCost = totalCost;
        match.expenses.perPersonCost = perPerson;
        match.expenses.payments = confirmedPlayers.map(r => ({
            player: r.player,
            amount: perPerson,
            paid: false
        }));

        await match.save();

        const updatedMatch = await Match.findById(match._id)
            .populate('expenses.payments.player', 'name avatar');

        res.status(200).json({
            success: true,
            data: updatedMatch.expenses
        });
    } catch (error) {
        next(error);
    }
};

const markAsPaid = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const paymentIndex = match.expenses.payments.findIndex(
            p => p.player.toString() === req.params.userId
        );

        if (paymentIndex === -1) {
            return res.status(404).json({ success: false, message: 'Player not found in payments' });
        }

        match.expenses.payments[paymentIndex].paid = true;
        match.expenses.payments[paymentIndex].paidAt = new Date();
        await match.save();

        res.status(200).json({
            success: true,
            message: 'Payment marked as paid'
        });
    } catch (error) {
        next(error);
    }
};

const submitScorecard = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const { teamAScore, teamBScore, battingStats, bowlingStats, fieldingStats, playerOfMatch } = req.body;

        match.scorecard = {
            teamAScore,
            teamBScore,
            battingStats: battingStats || [],
            bowlingStats: bowlingStats || [],
            fieldingStats: fieldingStats || [],
            playerOfMatch,
            winner: teamAScore.runs > teamBScore.runs ? 'teamA' :
                teamBScore.runs > teamAScore.runs ? 'teamB' : 'tie'
        };

        match.status = 'completed';
        await match.save();

        // Update player stats
        if (battingStats) {
            for (const stat of battingStats) {
                await User.findByIdAndUpdate(stat.player, {
                    $inc: {
                        'stats.totalRuns': stat.runs,
                        'stats.totalBallsFaced': stat.balls,
                        'stats.totalFours': stat.fours || 0,
                        'stats.totalSixes': stat.sixes || 0,
                        'stats.totalMatches': 0 // Will increment once below
                    }
                });

                // Update highest score
                const user = await User.findById(stat.player);
                if (stat.runs > user.stats.highestScore) {
                    user.stats.highestScore = stat.runs;
                    await user.save();
                }
                if (stat.runs >= 50) {
                    user.stats.fifties += 1;
                    await user.save();
                }
            }
        }

        if (bowlingStats) {
            for (const stat of bowlingStats) {
                await User.findByIdAndUpdate(stat.player, {
                    $inc: {
                        'stats.totalWickets': stat.wickets,
                        'stats.totalOversBowled': stat.overs,
                        'stats.totalRunsConceded': stat.runs
                    }
                });
            }
        }

        if (fieldingStats) {
            for (const stat of fieldingStats) {
                await User.findByIdAndUpdate(stat.player, {
                    $inc: {
                        'stats.totalCatches': stat.catches || 0,
                        'stats.totalRunOuts': stat.runOuts || 0,
                        'stats.totalStumpings': stat.stumpings || 0
                    }
                });
            }
        }

        // Increment match count for all confirmed players
        const confirmedPlayerIds = match.rsvps
            .filter(r => r.status === 'yes')
            .map(r => r.player);

        await User.updateMany(
            { _id: { $in: confirmedPlayerIds } },
            { $inc: { 'stats.totalMatches': 1, 'attendance.totalAttended': 1 } }
        );

        // Update POTM
        if (playerOfMatch) {
            await User.findByIdAndUpdate(playerOfMatch, {
                $inc: { 'stats.potmAwards': 1 }
            });
        }

        // Update group season
        await Group.findByIdAndUpdate(match.group, {
            $inc: { 'currentSeason.matchesPlayed': 1 }
        });

        const updatedMatch = await Match.findById(match._id)
            .populate('scorecard.battingStats.player', 'name avatar')
            .populate('scorecard.bowlingStats.player', 'name avatar')
            .populate('scorecard.fieldingStats.player', 'name avatar')
            .populate('scorecard.playerOfMatch', 'name avatar');

        res.status(200).json({
            success: true,
            data: updatedMatch.scorecard
        });
    } catch (error) {
        next(error);
    }
};

const uploadPhotos = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const cloudinary = require('../config/cloudinary');
        const streamifier = require('streamifier');

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `cricksquad/matches/${match._id}`,
                        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(file.buffer).pipe(stream);
            });
        });

        const results = await Promise.all(uploadPromises);

        const photos = results.map(result => ({
            url: result.secure_url,
            publicId: result.public_id,
            uploadedBy: req.user._id,
            caption: '',
            uploadedAt: new Date()
        }));

        match.photos.push(...photos);
        await match.save();

        res.status(200).json({
            success: true,
            message: `${photos.length} photos uploaded`,
            data: match.photos
        });
    } catch (error) {
        next(error);
    }
};

const deletePhoto = async (req, res, next) => {
    try {
        const match = await Match.findById(req.params.matchId);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const photo = match.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({ success: false, message: 'Photo not found' });
        }

        // Delete from cloudinary
        const cloudinary = require('../config/cloudinary');
        if (photo.publicId) {
            await cloudinary.uploader.destroy(photo.publicId);
        }

        match.photos.pull(req.params.photoId);
        await match.save();

        res.status(200).json({
            success: true,
            message: 'Photo deleted'
        });
    } catch (error) {
        next(error);
    }
};

const updateMatchStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        match.status = status;
        await match.save();

        res.status(200).json({
            success: true,
            data: match
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMatch,
    getMatch,
    getGroupMatches,
    getUpcomingMatch,
    submitRSVP,
    generateTeams,
    performToss,
    updateExpenses,
    markAsPaid,
    submitScorecard,
    uploadPhotos,
    deletePhoto,
    updateMatchStatus
};