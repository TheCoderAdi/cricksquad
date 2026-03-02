import { useEffect, useState, startTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGroupStore } from '../store/groupStore'
import matchService from '../services/matchService'
import aiService from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import {
    HiLocationMarker, HiClock, HiUserGroup,
    HiCheck, HiX, HiQuestionMarkCircle,
    HiLightningBolt, HiCurrencyRupee, HiChartBar,
    HiSpeakerphone, HiPhotograph
} from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'

const DashboardPage = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { currentGroup, groups, fetchGroups } = useGroupStore()
    const [upcomingMatch, setUpcomingMatch] = useState(null)
    const [lastMatch, setLastMatch] = useState(null)
    const [progressMatch, setProgressMatch] = useState(null)
    const [aiInsight, setAiInsight] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [rsvpLoading, setRsvpLoading] = useState(false)

    useEffect(() => {
        fetchGroups()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadDashboardData = async () => {
        setIsLoading(true)
        try {
            const { data: upcoming } = await matchService.getUpcoming(currentGroup._id)
            setUpcomingMatch(upcoming.data)

            const { data: matches } = await matchService.getGroupMatches(currentGroup._id, {
                status: 'completed',
                limit: 1
            })

            const { data: inProgressMatches } = await matchService.getGroupMatches(currentGroup._id, {
                status: 'in_progress',
                limit: 1
            })

            if (inProgressMatches.data?.length > 0) {
                setProgressMatch(inProgressMatches.data[0])
            }

            if (matches.data?.length > 0) {
                setLastMatch(matches.data[0])
            }

            try {
                const { data: insight } = await aiService.seasonAnalytics(currentGroup._id)
                setAiInsight(insight.data)
            } catch (e) {
                console.warn('Failed to load AI insights:', e)
            }
        } catch (error) {
            console.error('Dashboard load error:', error)
        } finally {
            setIsLoading(false)
        }
    }


    useEffect(() => {
        if (currentGroup) {
            startTransition(() => {
                loadDashboardData();
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGroup])

    const handleRSVP = async (status) => {
        if (!upcomingMatch) return
        setRsvpLoading(true)
        try {
            await matchService.submitRSVP(upcomingMatch._id, status)
            toast.success(`RSVP: ${status === 'yes' ? "You're in! 🏏" : status === 'no' ? 'Maybe next time!' : 'Noted as maybe'}`)
            loadDashboardData()
        } catch (error) {
            toast.error('Failed to update RSVP', error)
        }
        setRsvpLoading(false)
    }

    if (!isLoading && groups.length === 0) {
        return (
            <div className="py-10">
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                        Welcome, {user?.name?.split(' ')[0]}! 🏏
                    </h1>
                    <p className="text-gray-500">Let's get you set up with your cricket group</p>
                </Motion.div>

                <div className="space-y-4">
                    <Link to="/group/create" className="card block hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl">
                                ➕
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Create a Group</h3>
                                <p className="text-sm text-gray-500">Start your own cricket squad</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/group/join" className="card block hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                                🔗
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Join a Group</h3>
                                <p className="text-sm text-gray-500">Enter a group code to join</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }

    if (isLoading) return <LoadingSpinner message="Loading your dashboard..." />

    const yesCount = upcomingMatch?.rsvps?.filter(r => r.status === 'yes').length || 0
    const noCount = upcomingMatch?.rsvps?.filter(r => r.status === 'no').length || 0
    const maybeCount = upcomingMatch?.rsvps?.filter(r => r.status === 'maybe').length || 0
    const myRsvp = upcomingMatch?.rsvps?.find(r => r.player?._id === user?._id)

    return (
        <div className="space-y-5">
            {/* Greeting */}
            <Motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-xl font-display font-bold text-gray-900">
                    👋 Hey {user?.name?.split(' ')[0]}!
                </h1>
                {user?.attendance?.currentStreak > 0 && (
                    <p className="text-sm text-orange-500 font-medium mt-1">
                        🔥 {user.attendance.currentStreak}-week attendance streak!
                    </p>
                )}
            </Motion.div>

            {/* Upcoming Match Card */}
            {upcomingMatch ? (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card bg-gradient-to-br from-primary-600 to-green-700 text-white !border-0"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">🏏 This Week's Match</h2>
                        <span className="badge bg-white/20 text-white text-xs">
                            {upcomingMatch.status === 'rsvp_open' ? '📋 RSVP Open' : '✅ Teams Set'}
                        </span>
                    </div>

                    <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2 text-green-100">
                            <HiClock className="text-lg" />
                            <span className="text-sm">
                                {format(new Date(upcomingMatch.date), 'EEEE, MMM d')} • {upcomingMatch.time}
                            </span>
                        </div>
                        {upcomingMatch.venue && (
                            <div className="flex items-center gap-2 text-green-100">
                                <HiLocationMarker className="text-lg" />
                                <span className="text-sm">{upcomingMatch.venue.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-green-100">
                            <span className="flex items-center gap-1 text-sm">
                                <HiCheck className="text-green-300" /> {yesCount} Yes
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                                <HiQuestionMarkCircle className="text-yellow-300" /> {maybeCount} Maybe
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                                <HiX className="text-red-300" /> {noCount} No
                            </span>
                        </div>
                    </div>

                    {/* RSVP Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleRSVP('yes')}
                            disabled={rsvpLoading}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${myRsvp?.status === 'yes'
                                ? 'bg-white text-green-700'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            ✅ I'm In
                        </button>
                        <button
                            onClick={() => handleRSVP('no')}
                            disabled={rsvpLoading}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${myRsvp?.status === 'no'
                                ? 'bg-white text-red-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            ❌ Can't
                        </button>
                        <button
                            onClick={() => handleRSVP('maybe')}
                            disabled={rsvpLoading}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${myRsvp?.status === 'maybe'
                                ? 'bg-white text-yellow-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            🤔 Maybe
                        </button>
                    </div>

                    {/* RSVP Deadline */}
                    {upcomingMatch.rsvpDeadline && (
                        <p className="text-center text-green-200 text-xs mt-3">
                            ⏰ RSVP closes {formatDistanceToNow(new Date(upcomingMatch.rsvpDeadline), { addSuffix: true })}
                        </p>
                    )}
                </Motion.div>
            ) : (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card text-center py-8"
                >
                    <p className="text-4xl mb-3">🏏</p>
                    <h3 className="font-bold text-gray-900 mb-1">No Upcoming Match</h3>
                    <p className="text-sm text-gray-500 mb-4">Create one to get the squad going!</p>
                    <button
                        onClick={() => navigate('/group/settings')}
                        className="btn-primary text-sm"
                    >
                        + Schedule Match
                    </button>
                </Motion.div>
            )}

            {/* Quick Actions */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { icon: <HiUserGroup />, label: 'Teams', to: upcomingMatch ? `/teams/${upcomingMatch._id}` : '#', color: 'bg-blue-100 text-blue-600' },
                        { icon: <HiCurrencyRupee />, label: 'Dues', to: upcomingMatch ? `/expenses/${upcomingMatch._id}` : '#', color: 'bg-green-100 text-green-600' },
                        { icon: <HiChartBar />, label: 'Stats', to: '/leaderboard', color: 'bg-purple-100 text-purple-600' },
                        { icon: <HiSpeakerphone />, label: 'Announce', to: '/announcements', color: 'bg-orange-100 text-orange-600' },
                        { icon: <HiLocationMarker />, label: 'Venues', to: upcomingMatch ? `/venue/${upcomingMatch._id}` : '#', color: 'bg-rose-100 text-rose-600' },
                        { icon: <HiPhotograph />, label: 'Gallery', to: upcomingMatch ? `/gallery/${upcomingMatch._id}` : '#', color: 'bg-pink-100 text-pink-600' },
                        { icon: '📊', label: 'Scorecard', to: progressMatch ? `/scorecard/${progressMatch._id}` : '#', color: 'bg-yellow-100 text-yellow-600' },
                        { icon: <HiCheck />, label: 'RSVP', to: upcomingMatch ? `/rsvp/${upcomingMatch._id}` : '#', color: 'bg-green-100 text-green-600' },
                    ]
                        .map((action, i) => (
                            <Link
                                key={i}
                                to={action.to}
                                className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center text-xl`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-medium text-gray-600">{action.label}</span>
                            </Link>
                        ))}
                </div>
            </Motion.div>

            {/* Last Match Result */}
            {lastMatch && lastMatch.scorecard && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900">🏆 Last Match</h2>
                        <span className="text-xs text-gray-400">
                            {format(new Date(lastMatch.date), 'MMM d')}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                            <p className="font-bold text-gray-900 text-sm">{lastMatch.teamA?.name || 'Team A'}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {lastMatch.scorecard.teamAScore?.runs}/{lastMatch.scorecard.teamAScore?.wickets}
                            </p>
                            <p className="text-xs text-gray-400">
                                ({lastMatch.scorecard.teamAScore?.overs} ov)
                            </p>
                        </div>

                        <div className="px-4">
                            <span className="text-gray-300 font-bold text-lg">vs</span>
                        </div>

                        <div className="text-center flex-1">
                            <p className="font-bold text-gray-900 text-sm">{lastMatch.teamB?.name || 'Team B'}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {lastMatch.scorecard.teamBScore?.runs}/{lastMatch.scorecard.teamBScore?.wickets}
                            </p>
                            <p className="text-xs text-gray-400">
                                ({lastMatch.scorecard.teamBScore?.overs} ov)
                            </p>
                        </div>
                    </div>

                    {lastMatch.scorecard.playerOfMatch && (
                        <div className="bg-yellow-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <span className="text-lg">⭐</span>
                            <span className="text-sm font-medium text-yellow-800">
                                POTM: {lastMatch.scorecard.playerOfMatch?._id === user?._id ? `${lastMatch.scorecard.playerOfMatch?.name} (You)` : lastMatch.scorecard.playerOfMatch?.name || 'N/A'}
                            </span>
                        </div>
                    )}

                    <Link
                        to={`/scorecard/${lastMatch._id}`}
                        className="block text-center text-primary-600 text-sm font-medium mt-3 hover:underline"
                    >
                        View Full Scorecard →
                    </Link>
                </Motion.div>
            )}

            {/* AI Insight */}
            {aiInsight && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card bg-gradient-to-br from-purple-50 to-blue-50 !border-purple-100"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <HiLightningBolt className="text-purple-600" />
                        <h2 className="font-bold text-purple-900 text-sm">🤖 AI Insight</h2>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">
                        {aiInsight.seasonSummary || aiInsight.funFacts?.[0] || 'Analyzing your group data...'}
                    </p>
                    {aiInsight.funFacts && aiInsight.funFacts.length > 1 && (
                        <p className="text-xs text-purple-600 mt-2 font-medium">
                            💡 {aiInsight.funFacts[1]}
                        </p>
                    )}
                </Motion.div>
            )}

            {/* Group Code */}
            {currentGroup && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card text-center"
                >
                    <p className="text-sm text-gray-500 mb-2">Invite friends to join</p>
                    <div className="flex items-center justify-center gap-3">
                        <code className="bg-gray-100 px-6 py-2.5 rounded-xl font-mono font-bold text-xl text-gray-900 tracking-widest">
                            {currentGroup.code}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(currentGroup.code)
                                toast.success('Code copied!')
                            }}
                            className="p-2.5 bg-primary-100 rounded-xl text-primary-600 hover:bg-primary-200 transition-colors"
                        >
                            📋
                        </button>
                    </div>
                </Motion.div>
            )}
        </div>
    )
}

export default DashboardPage