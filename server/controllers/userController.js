const User = require('../models/User');
const Match = require('../models/Match');

const getPlayerStats = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const stats = {
            ...user.stats.toObject(),
            attendancePercentage: user.getAttendancePercentage(),
            battingAverage: user.getBattingAverage(),
            bowlingAverage: user.getBowlingAverage(),
            strikeRate: user.getStrikeRate(),
            currentStreak: user.attendance.currentStreak,
            longestStreak: user.attendance.longestStreak
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

const getLeaderboard = async (req, res, next) => {
    try {
        const { category = 'runs', season = 'all' } = req.query;

        const Group = require('../models/Group');
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const memberIds = group.members.map(m => m.user);

        let sortField;
        switch (category) {
            case 'runs':
                sortField = { 'stats.totalRuns': -1 };
                break;
            case 'wickets':
                sortField = { 'stats.totalWickets': -1 };
                break;
            case 'catches':
                sortField = { 'stats.totalCatches': -1 };
                break;
            case 'matches':
                sortField = { 'stats.totalMatches': -1 };
                break;
            case 'potm':
                sortField = { 'stats.potmAwards': -1 };
                break;
            case 'attendance':
                sortField = { 'attendance.totalAttended': -1 };
                break;
            case 'rating':
                sortField = { 'overallRating': -1 };
                break;
            default:
                sortField = { 'stats.totalRuns': -1 };
        }

        const players = await User.find({ _id: { $in: memberIds } })
            .select('name avatar playerRole overallRating stats attendance')
            .sort(sortField)
            .limit(25);

        // Add computed fields
        const leaderboard = players.map((player, index) => ({
            rank: index + 1,
            player: {
                _id: player._id,
                name: player.name,
                avatar: player.avatar,
                playerRole: player.playerRole,
                overallRating: player.overallRating
            },
            stats: {
                ...player.stats.toObject(),
                attendancePercentage: player.getAttendancePercentage(),
                battingAverage: player.getBattingAverage(),
                bowlingAverage: player.getBowlingAverage(),
                strikeRate: player.getStrikeRate()
            }
        }));

        res.status(200).json({
            success: true,
            category,
            data: leaderboard
        });
    } catch (error) {
        next(error);
    }
};

const getRunningBalances = async (req, res, next) => {
    try {
        const matches = await Match.find({
            group: req.params.groupId,
            'expenses.totalCost': { $gt: 0 }
        }).populate('expenses.payments.player', 'name avatar');

        const balances = {};

        for (const match of matches) {
            for (const payment of match.expenses.payments) {
                if (!payment.player) continue;

                const playerId = payment.player._id.toString();
                if (!balances[playerId]) {
                    balances[playerId] = {
                        player: {
                            _id: payment.player._id,
                            name: payment.player.name,
                            avatar: payment.player.avatar
                        },
                        totalOwed: 0,
                        totalPaid: 0,
                        balance: 0,
                        unpaidMatches: 0
                    };
                }

                balances[playerId].totalOwed += payment.amount;
                if (payment.paid) {
                    balances[playerId].totalPaid += payment.amount;
                } else {
                    balances[playerId].unpaidMatches += 1;
                }
                balances[playerId].balance = balances[playerId].totalOwed - balances[playerId].totalPaid;
            }
        }

        const sortedBalances = Object.values(balances).sort((a, b) => b.balance - a.balance);

        res.status(200).json({
            success: true,
            data: sortedBalances
        });
    } catch (error) {
        next(error);
    }
};

const updateSkills = async (req, res, next) => {
    try {
        const { battingSkill, bowlingSkill, fieldingSkill, playerRole } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Only allow self-update or admin update
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Can only update your own skills' });
        }

        if (battingSkill !== undefined) user.battingSkill = battingSkill;
        if (bowlingSkill !== undefined) user.bowlingSkill = bowlingSkill;
        if (fieldingSkill !== undefined) user.fieldingSkill = fieldingSkill;
        if (playerRole !== undefined) user.playerRole = playerRole;

        await user.save();

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPlayerStats, getLeaderboard, getRunningBalances, updateSkills };