const { generateContent } = require('../config/gemini');
const Match = require('../models/Match');
const User = require('../models/User');
const Group = require('../models/Group');
const sendEmail = require('../utils/sendEmail');

const parseAIJsonResponse = async (prompt) => {
    const response = await generateContent(prompt);
    const cleanResponse = (response || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleanResponse);
    } catch (e) {
        const err = new Error('AI_INVALID_FORMAT');
        err.original = e;
        throw err;
    }
};

const aiBalanceTeams = async (req, res, next) => {
    try {
        const { matchId } = req.body;

        const match = await Match.findById(matchId)
            .populate('rsvps.player', 'name playerRole overallRating battingSkill bowlingSkill fieldingSkill stats');

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const confirmedPlayers = match.rsvps
            .filter(r => r.status === 'yes')
            .map(r => ({
                id: r.player._id,
                name: r.player.name,
                role: r.player.playerRole,
                overall: r.player.overallRating,
                batting: r.player.battingSkill,
                bowling: r.player.bowlingSkill,
                fielding: r.player.fieldingSkill,
                recentRuns: r.player.stats.totalRuns,
                recentWickets: r.player.stats.totalWickets,
                matches: r.player.stats.totalMatches
            }));

        if (confirmedPlayers.length === 0) {
            return res.status(400).json({ success: false, message: 'No confirmed players to balance teams' });
        }

        const prompt = `
You are a cricket team selector AI. Given the following ${confirmedPlayers.length} players with their skills, create the two most balanced teams possible.

Players:
${JSON.stringify(confirmedPlayers, null, 2)}

Requirements:
1. Split players into exactly 2 teams as evenly as possible
2. Balance overall team ratings (total rating difference should be minimal)
3. Each team should have a mix of batsmen, bowlers, and allrounders
4. Consider recent form (runs and wickets) as a bonus factor
5. Each team should have at least 1 bowler

Respond in this exact JSON format:
{
  "teamA": {
    "name": "Creative team name with emoji",
    "playerIds": ["id1", "id2", ...],
    "totalRating": number,
    "strengths": "Brief strength analysis"
  },
  "teamB": {
    "name": "Creative team name with emoji",
    "playerIds": ["id1", "id2", ...],
    "totalRating": number,
    "strengths": "Brief strength analysis"
  },
  "analysis": "Brief explanation of why this split is balanced",
  "balanceDiff": number,
  "prediction": "Fun one-line match prediction"
}

Return ONLY valid JSON, no markdown or extra text.
`;

        // aiBalanceTeams: always generate teams on-demand (no persistent caching needed)
        try {
            const aiResult = await parseAIJsonResponse(prompt);
            return res.status(200).json({ success: true, data: aiResult });
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({ success: false, message: 'AI returned invalid format. Please try again.' });
            }
            throw parseError;
        }
    } catch (error) {
        next(error);
    }
};

const aiMatchSummary = async (req, res, next) => {
    try {
        const { matchId } = req.body;

        const match = await Match.findById(matchId)
            .populate('teamA.players', 'name')
            .populate('teamB.players', 'name')
            .populate('scorecard.battingStats.player', 'name')
            .populate('scorecard.bowlingStats.player', 'name')
            .populate('scorecard.playerOfMatch', 'name')
            .populate('venue', 'name');

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        if (!match.scorecard || !match.scorecard.winner) {
            return res.status(400).json({ success: false, message: 'Match scorecard not available' });
        }

        if (!match.scorecard.battingStats.length && !match.scorecard.bowlingStats.length) {
            return res.status(400).json({ success: false, message: 'No match statistics available' });
        }

        const matchData = {
            venue: match.venue?.name || 'Unknown venue',
            date: match.date,
            teamA: {
                name: match.teamA.name,
                players: match.teamA.players.map(p => p.name),
                score: match.scorecard.teamAScore
            },
            teamB: {
                name: match.teamB.name,
                players: match.teamB.players.map(p => p.name),
                score: match.scorecard.teamBScore
            },
            winner: match.scorecard.winner,
            potm: match.scorecard.playerOfMatch?.name,
            battingStats: match.scorecard.battingStats.map(s => ({
                player: s.player?.name,
                runs: s.runs,
                balls: s.balls,
                fours: s.fours,
                sixes: s.sixes
            })),
            bowlingStats: match.scorecard.bowlingStats.map(s => ({
                player: s.player?.name,
                overs: s.overs,
                runs: s.runs,
                wickets: s.wickets
            }))
        };


        const prompt = `
You are an entertaining cricket commentator. Write a fun, engaging match summary for a weekend cricket game between friends.

Match Data:
${JSON.stringify(matchData, null, 2)}

Write in this JSON format:
{
  "headline": "Catchy headline for the match (max 100 chars)",
  "summary": "2-3 paragraph entertaining match report written like a sports journalist. Use player names. Make it fun and dramatic. Include key moments.",
  "highlights": [
    "Highlight 1 - key moment",
    "Highlight 2 - key moment",
    "Highlight 3 - key moment"
  ],
  "funFacts": [
    "Fun stat or fact about the match",
    "Another fun fact"
  ],
  "playerRatings": [
    {"name": "Player Name", "rating": "8/10", "comment": "Brief performance comment"}
  ]
}

Return ONLY valid JSON.
`;

        // If a cached summary exists and client did not request regeneration, return it
        const regenerate = !!req.body.regenerate;
        if (!regenerate && match.aiSummary) {
            return res.status(200).json({
                success: true,
                data: {
                    summary: match.aiSummary,
                    highlights: match.aiHighlights
                }
            });
        }

        // If regenerate requested, ensure caller is a group admin
        if (regenerate) {
            const group = await Group.findById(match.group);
            const member = group.members.find(m => String(m.user) === String(req.user._id));
            if (!member || member.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only group admins can regenerate AI content' });
            }
        }

        let aiResult;
        try {
            aiResult = await parseAIJsonResponse(prompt);
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({
                    success: false,
                    message: 'AI returned invalid format. Please try again.'
                });
            }
            throw parseError;
        }

        match.aiSummary = aiResult.summary;
        match.aiHighlights = aiResult.highlights;
        await match.save();

        res.status(200).json({ success: true, data: aiResult });
    } catch (error) {
        next(error);
    }
};

const aiPlayerInsight = async (req, res, next) => {
    try {
        const { playerId, groupId } = req.body;

        const user = await User.findById(playerId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const recentMatches = await Match.find({
            group: groupId,
            status: 'completed',
            'rsvps.player': playerId
        })
            .sort('-date')
            .limit(10)
            .select('scorecard date teamA teamB');

        if (recentMatches.length === 0) {
            return res.status(400).json({ success: false, message: 'No recent matches found for this player' });
        }

        const recentPerformances = [];
        for (const match of recentMatches) {
            const batting = match.scorecard.battingStats.find(
                s => s.player?.toString() === playerId
            );
            const bowling = match.scorecard.bowlingStats.find(
                s => s.player?.toString() === playerId
            );

            recentPerformances.push({
                date: match.date,
                runs: batting?.runs || 0,
                balls: batting?.balls || 0,
                wickets: bowling?.wickets || 0,
                overs: bowling?.overs || 0
            });
        }

        const playerData = {
            name: user.name,
            role: user.playerRole,
            skills: {
                batting: user.battingSkill,
                bowling: user.bowlingSkill,
                fielding: user.fieldingSkill,
                overall: user.overallRating
            },
            careerStats: {
                matches: user.stats.totalMatches,
                runs: user.stats.totalRuns,
                wickets: user.stats.totalWickets,
                catches: user.stats.totalCatches,
                highestScore: user.stats.highestScore,
                fifties: user.stats.fifties,
                potmAwards: user.stats.potmAwards,
                battingAverage: user.getBattingAverage(),
                strikeRate: user.getStrikeRate(),
                bowlingAverage: user.getBowlingAverage()
            },
            attendance: {
                percentage: user.getAttendancePercentage(),
                currentStreak: user.attendance.currentStreak
            },
            recentForm: recentPerformances
        };

        const prompt = `
You are a cricket analyst AI. Provide a detailed, fun insight for this weekend cricket player.

Player Data:
${JSON.stringify(playerData, null, 2)}

Respond in this JSON format:
{
  "overallAssessment": "2-3 sentences about the player's overall ability",
  "strengths": ["Strength 1", "Strength 2"],
  "areasToImprove": ["Area 1", "Area 2"],
  "formAnalysis": "Analysis of recent form trends",
  "funComparison": "Compare to a famous cricketer in a fun way (e.g., 'The Virat Kohli of your group')",
  "tip": "One practical tip to improve their game",
  "prediction": "Fun prediction for their next match"
}

Return ONLY valid JSON.
`;

        const regenerate = !!req.body.regenerate;

        // check cached insight on the user document for this group
        const existing = (user.aiInsights || []).find(x => String(x.group) === String(groupId));
        if (!regenerate && existing && existing.data) {
            return res.status(200).json({ success: true, data: existing.data });
        }

        // if regeneration requested, ensure caller is a group admin
        if (regenerate) {
            const group = await Group.findById(groupId);
            const member = group.members.find(m => String(m.user) === String(req.user._id));
            if (!member || member.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only group admins can regenerate AI content' });
            }
        }

        let aiResult;
        try {
            aiResult = await parseAIJsonResponse(prompt);
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({
                    success: false,
                    message: 'AI returned invalid format. Please try again.'
                });
            }
            throw parseError;
        }

        // store into user's aiInsights for this group (best-effort)
        try {
            const idx = (user.aiInsights || []).findIndex(x => String(x.group) === String(groupId));
            const payload = { group: groupId, data: aiResult, lastGeneratedAt: new Date(), generatedBy: req.user._id };
            if (idx >= 0) {
                user.aiInsights[idx] = payload;
            } else {
                user.aiInsights = [...(user.aiInsights || []), payload];
            }
            await user.save();
        } catch (e) {
            console.warn('Failed to save player AI insight', e);
        }

        res.status(200).json({ success: true, data: aiResult });
    } catch (error) {
        next(error);
    }
};

const aiPotmSuggestion = async (req, res, next) => {
    try {
        const { matchId } = req.body;

        const match = await Match.findById(matchId)
            .populate('scorecard.battingStats.player', 'name')
            .populate('scorecard.bowlingStats.player', 'name')
            .populate('scorecard.fieldingStats.player', 'name');

        if (!match || !match.scorecard) {
            return res.status(400).json({ success: false, message: 'Scorecard not available' });
        }

        const matchStats = {
            teamAScore: match.scorecard.teamAScore,
            teamBScore: match.scorecard.teamBScore,
            winner: match.scorecard.winner,
            batting: match.scorecard.battingStats.map(s => ({
                player: s.player?.name,
                playerId: s.player?._id,
                runs: s.runs,
                balls: s.balls,
                fours: s.fours,
                sixes: s.sixes
            })),
            bowling: match.scorecard.bowlingStats.map(s => ({
                player: s.player?.name,
                playerId: s.player?._id,
                overs: s.overs,
                runs: s.runs,
                wickets: s.wickets
            })),
            fielding: match.scorecard.fieldingStats.map(s => ({
                player: s.player?.name,
                playerId: s.player?._id,
                catches: s.catches,
                runOuts: s.runOuts
            }))
        };

        const prompt = `
You are a cricket expert. Based on the match statistics, suggest the top 3 Player of the Match candidates.

Match Stats:
${JSON.stringify(matchStats, null, 2)}

Consider batting performance, bowling figures, fielding contributions, and match impact.

Respond in JSON format:
{
  "candidates": [
    {
      "rank": 1,
      "name": "Player Name",
      "playerId": "id",
      "performance": "Brief description of their performance",
      "impactScore": number (1-10),
      "reason": "Why they deserve POTM"
    }
  ],
  "verdict": "Final recommendation with reasoning"
}

Return ONLY valid JSON.
`;

        const regenerate = !!req.body.regenerate;

        // If cached POTM candidates exist on the match and regenerate not requested, return them
        if (!regenerate && match.aiPotmCandidates) {
            return res.status(200).json({ success: true, data: match.aiPotmCandidates });
        }

        // If regenerate requested, ensure caller is a group admin
        if (regenerate) {
            const group = await Group.findById(match.group);
            const member = group.members.find(m => String(m.user) === String(req.user._id));
            if (!member || member.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only group admins can regenerate AI content' });
            }
        }

        let aiResult;
        try {
            aiResult = await parseAIJsonResponse(prompt);
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({ success: false, message: 'AI returned invalid format. Please try again.' });
            }
            throw parseError;
        }

        try {
            match.aiPotmCandidates = aiResult;
            await match.save();
        } catch (e) {
            console.warn('Failed to save POTM candidates', e);
        }

        res.status(200).json({ success: true, data: aiResult });
    } catch (error) {
        next(error);
    }
};

const aiSeasonAnalytics = async (req, res, next) => {
    try {
        const { groupId } = req.body;

        const group = await Group.findById(groupId)
            .populate('members.user', 'name stats attendance overallRating playerRole');

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const matches = await Match.find({
            group: groupId,
            status: 'completed'
        })
            .sort('-date')
            .limit(20)
            .select('scorecard date teamA teamB');

        if (matches.length === 0) {
            return res.status(400).json({ success: false, message: 'No completed matches found for this group' });
        }



        const seasonData = {
            groupName: group.name,
            totalMembers: group.members.length,
            totalMatches: matches.length,
            players: group.members.map(m => ({
                name: m.user.name,
                role: m.user.playerRole,
                rating: m.user.overallRating,
                runs: m.user.stats.totalRuns,
                wickets: m.user.stats.totalWickets,
                matches: m.user.stats.totalMatches,
                attendance: m.user.attendance.totalAttended
            })),
            recentScores: matches.map(m => ({
                date: m.date,
                teamAScore: m.scorecard.teamAScore,
                teamBScore: m.scorecard.teamBScore,
                winner: m.scorecard.winner
            }))
        };


        const prompt = `
You are a cricket analytics expert. Analyze this weekend cricket group's season data and provide fun, insightful analytics.

Season Data:
${JSON.stringify(seasonData, null, 2)}

Respond in JSON format:
{
  "seasonSummary": "2-3 sentence overview of the season",
  "keyStats": [
    {"label": "Stat name", "value": "Stat value", "insight": "Brief insight"}
  ],
  "awards": [
    {"title": "🏆 Award name", "winner": "Player name", "reason": "Why"}
  ],
  "trends": [
    "Interesting trend 1",
    "Interesting trend 2"
  ],
  "funFacts": [
    "Fun fact 1",
    "Fun fact 2",
    "Fun fact 3"
  ],
  "predictions": [
    "Prediction for next matches"
  ],
  "groupHealth": {
    "score": number (1-10),
    "comment": "How active and engaged is this group"
  }
}

Return ONLY valid JSON.
`;

        const regenerate = !!req.body.regenerate;

        // Return cached analytics if available and regeneration not requested
        if (!regenerate && group.aiSeasonAnalytics && group.aiSeasonAnalytics.data) {
            return res.status(200).json({ success: true, data: group.aiSeasonAnalytics.data });
        }

        // If regeneration requested, ensure caller is a group admin
        if (regenerate) {
            const member = group.members.find(m => String(m.user) === String(req.user._id));
            if (!member || member.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only group admins can regenerate AI content' });
            }
        }


        let aiResult;
        try {
            aiResult = await parseAIJsonResponse(prompt);
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({
                    success: false,
                    message: 'AI returned invalid format. Please try again.'
                });
            }
            throw parseError;
        }

        try {
            group.aiSeasonAnalytics = {
                data: aiResult,
                lastGeneratedAt: new Date(),
                generatedBy: req.user?._id
            };
            await group.save();
        } catch (e) {
            console.warn('Failed to save season analytics', e);
        }

        res.status(200).json({ success: true, data: aiResult });
    } catch (error) {
        next(error);
    }
};

const aiSmartReminder = async (req, res, next) => {
    try {
        const { playerId, matchId } = req.body;

        const user = await User.findById(playerId);
        const match = await Match.findById(matchId).populate('venue', 'name');

        if (!user || !match) {
            return res.status(404).json({ success: false, message: 'Player or match not found' });
        }

        const playerData = {
            name: user.name,
            attendancePercentage: user.getAttendancePercentage(),
            currentStreak: user.attendance.currentStreak,
            totalMatches: user.stats.totalMatches
        };

        const matchData = {
            date: match.date,
            time: match.time,
            venue: match.venue?.name
        };

        const prompt = `
Generate a short, friendly, personalized WhatsApp-style reminder for this cricket player to RSVP for the upcoming match.

Player: ${JSON.stringify(playerData)}
Match: ${JSON.stringify(matchData)}

Make it casual, fun, and use emojis. Keep it under 150 characters. Reference their attendance streak if impressive, or gently nudge if they've been missing.

Respond in JSON format:
{
  "message": "The reminder message",
  "tone": "encouraging/playful/urgent"
}

Return ONLY valid JSON.
`;

        let aiResult;
        try {
            aiResult = await parseAIJsonResponse(prompt);
        } catch (parseError) {
            if (parseError.message === 'AI_INVALID_FORMAT') {
                return res.status(500).json({
                    success: false,
                    message: 'AI returned invalid format. Please try again.'
                });
            }
            throw parseError;
        }

        try {
            const subject = `Reminder: RSVP for ${match.venue?.name || 'upcoming match'} on ${new Date(match.date).toLocaleDateString()}`;
            const rsvpUrl = `${process.env.CLIENT_URL || ''}/rsvp/${match._id}`;
            const text = aiResult.message + (rsvpUrl ? `\n\nRSVP: ${rsvpUrl}` : '');
            const html = `<p>${aiResult.message}</p>${rsvpUrl ? `<p><a href="${rsvpUrl}">RSVP here</a></p>` : ''}<p style="font-size:12px;color:#666">(This is an automated reminder from CrickSquad)</p>`;
            sendEmail({ to: user.email, subject, text, html }).catch(err => console.error('Smart reminder email error:', err));
        } catch (mailErr) {
            console.error('Smart reminder mail dispatch failed:', mailErr);
        }

        res.status(200).json({
            success: true,
            data: aiResult
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    aiBalanceTeams,
    aiMatchSummary,
    aiPlayerInsight,
    aiPotmSuggestion,
    aiSeasonAnalytics,
    aiSmartReminder
};