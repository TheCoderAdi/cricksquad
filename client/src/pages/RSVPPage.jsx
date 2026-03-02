import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import matchService from '../services/matchService'
import aiService from '../services/aiService'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { HiCheck, HiX, HiQuestionMarkCircle, HiClock, HiBell } from 'react-icons/hi'
import { startTransition } from 'react'
import { useGroupStore } from '../store/groupStore'

const RSVPPage = () => {
    const { matchId } = useParams()
    const { user } = useAuthStore()
    const { isCurrentUserAdmin } = useGroupStore()
    const [match, setMatch] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [rsvpLoading, setRsvpLoading] = useState(false)
    const [reminderLoading, setReminderLoading] = useState({})


    const loadMatch = async () => {
        try {
            const { data } = await matchService.getById(matchId)
            setMatch(data.data)
        } catch (error) {
            toast.error('Failed to load match', error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        startTransition(() => {
            loadMatch();
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId])

    const handleRSVP = async (status) => {
        setRsvpLoading(true)
        try {
            await matchService.submitRSVP(matchId, status)
            toast.success(status === 'yes' ? "You're in! 🏏" : status === 'no' ? 'Noted!' : 'Maybe it is!')
            loadMatch()
        } catch (error) {
            toast.error('Failed to update RSVP', error)
        }
        setRsvpLoading(false)
    }

    const handleSmartReminder = async (playerId) => {
        setReminderLoading(prev => ({ ...prev, [playerId]: true }))
        try {
            const { data } = await aiService.smartReminder(playerId, matchId)
            toast.success(`Reminder sent: "${data.data.message}"`)
        } catch (error) {
            toast.error('Failed to send reminder', error)
        }
        setReminderLoading(prev => ({ ...prev, [playerId]: false }))
    }

    if (isLoading) return <LoadingSpinner message="Loading RSVP..." />
    if (!match) return <div className="text-center py-10">Match not found</div>

    const yesPlayers = match.rsvps?.filter(r => r.status === 'yes') || []
    const noPlayers = match.rsvps?.filter(r => r.status === 'no') || []
    const maybePlayers = match.rsvps?.filter(r => r.status === 'maybe') || []
    const myRsvp = match.rsvps?.find(r => r.player?._id === user?._id)

    // Get members who haven't responded
    const respondedIds = match.rsvps?.map(r => r.player?._id) || []
    const totalMembers = match.group?.members?.length || 0
    const pendingCount = totalMembers - respondedIds.length

    return (
        <div className="space-y-5">
            {/* Header */}
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">📋 RSVP Status</h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <HiClock />
                    <span>{format(new Date(match.date), 'EEEE, MMM d')} • {match.time}</span>
                </div>
                {match.rsvpDeadline && (
                    <p className="text-xs text-orange-500 font-medium mt-1">
                        ⏰ Deadline: {formatDistanceToNow(new Date(match.rsvpDeadline), { addSuffix: true })}
                    </p>
                )}
            </Motion.div>

            {/* RSVP Buttons */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                <h3 className="font-bold text-gray-900 mb-3">Your Response</h3>
                <div className="flex gap-2">
                    {[
                        { status: 'yes', label: "✅ I'm In", activeClass: 'bg-green-600 text-white', inactiveClass: 'bg-green-50 text-green-700 border-green-200' },
                        { status: 'no', label: "❌ Can't Make It", activeClass: 'bg-red-500 text-white', inactiveClass: 'bg-red-50 text-red-700 border-red-200' },
                        { status: 'maybe', label: '🤔 Maybe', activeClass: 'bg-yellow-500 text-white', inactiveClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                    ].map(({ status, label, activeClass, inactiveClass }) => (
                        <button
                            key={status}
                            onClick={() => handleRSVP(status)}
                            disabled={rsvpLoading}
                            className={`flex-1 py-3 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${myRsvp?.status === status ? activeClass : inactiveClass
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </Motion.div>

            {/* Summary Bar */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-4 gap-3"
            >
                {[
                    { count: yesPlayers.length, label: 'Yes', color: 'bg-green-100 text-green-700' },
                    { count: maybePlayers.length, label: 'Maybe', color: 'bg-yellow-100 text-yellow-700' },
                    { count: noPlayers.length, label: 'No', color: 'bg-red-100 text-red-700' },
                    { count: pendingCount, label: 'Pending', color: 'bg-gray-100 text-gray-700' },
                ].map((item, i) => (
                    <div key={i} className={`rounded-xl p-3 text-center ${item.color}`}>
                        <p className="text-2xl font-bold">{item.count}</p>
                        <p className="text-xs font-medium">{item.label}</p>
                    </div>
                ))}
            </Motion.div>

            {/* Yes List */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
            >
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <HiCheck className="text-green-500" />
                    Confirmed ({yesPlayers.length})
                </h3>
                <div className="space-y-2">
                    {yesPlayers.map((rsvp, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                                    {rsvp.player?.avatar ? (
                                        <img src={rsvp.player.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-green-700">
                                            {rsvp.player?.name?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{rsvp.player?.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{rsvp.player?.playerRole}</p>
                                </div>
                            </div>
                            <span className="badge-blue text-xs">⭐ {rsvp.player?.overallRating}</span>
                        </div>
                    ))}
                    {yesPlayers.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-3">No confirmations yet</p>
                    )}
                </div>
            </Motion.div>

            {/* Maybe List */}
            {maybePlayers.length > 0 && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="card"
                >
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <HiQuestionMarkCircle className="text-yellow-500" />
                        Maybe ({maybePlayers.length})
                    </h3>
                    {
                        isCurrentUserAdmin() &&
                        <div className="space-y-2">
                            {maybePlayers.map((rsvp, i) => (
                                <div key={i} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <span className="text-sm font-bold text-yellow-700">
                                                {rsvp.player?.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm text-gray-900">{rsvp.player?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSmartReminder(rsvp.player?._id)}
                                        disabled={reminderLoading[rsvp.player?._id]}
                                        className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-100 transition-colors"
                                    >
                                        {reminderLoading[rsvp.player?._id] ? '...' : '🔔 Nudge'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    }
                </Motion.div>
            )}

            {/* No List */}
            {noPlayers.length > 0 && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                >
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <HiX className="text-red-500" />
                        Can't Make It ({noPlayers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {noPlayers.map((rsvp, i) => (
                            <span key={i} className="badge bg-gray-100 text-gray-500 text-xs">
                                {rsvp.player?.name}
                            </span>
                        ))}
                    </div>
                </Motion.div>
            )}

            {/* Generate Teams Button */}
            {yesPlayers.length >= 4 && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <button
                        onClick={() => window.location.href = `/teams/${matchId}`}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        ⚖️ Generate Balanced Teams ({yesPlayers.length} players)
                    </button>
                </Motion.div>
            )}
        </div>
    )
}

export default RSVPPage