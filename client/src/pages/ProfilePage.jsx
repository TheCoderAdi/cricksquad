import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGroupStore } from '../store/groupStore'
import userService from '../services/userService'
import aiService from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { HiPencil, HiLogout } from 'react-icons/hi'
import { startTransition } from 'react'
import { motion as Motion } from 'framer-motion'

const ProfilePage = () => {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { currentGroup } = useGroupStore()
    const [stats, setStats] = useState(null)
    const [aiInsight, setAiInsight] = useState(null)
    const [aiRegenerating, setAiRegenerating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editData, setEditData] = useState({})

    const profileId = userId || user?._id
    const isOwnProfile = !userId || userId === user?._id


    const loadProfile = async () => {
        try {
            const { data } = await userService.getStats(profileId)
            setStats(data.data)

            // AI insight
            if (currentGroup) {
                try {
                    const { data: insight } = await aiService.playerInsight(profileId, currentGroup._id)
                    setAiInsight(insight.data)
                } catch (e) {
                    console.error('AI insight error:', e)
                }
            }
        } catch (error) {
            toast.error('Failed to load profile', error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        startTransition(() => {

            loadProfile()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId])

    const handleRegeneratePlayerInsight = async () => {
        if (!currentGroup) return toast.error('No group selected')
        setAiRegenerating(true)
        try {
            const { data } = await aiService.playerInsight(profileId, currentGroup._id, { regenerate: true })
            if (data?.success) setAiInsight(data.data)
            else toast.error(data?.message || 'Failed to regenerate player insight')
        } catch (e) {
            toast.error(`${e.response?.data?.message || 'Failed to regenerate player insight'}`)
        } finally { setAiRegenerating(false) }
    }


    const handleSaveSkills = async () => {
        const result = await userService.updateSkills(profileId, editData)
        if (result.data?.success) {
            toast.success('Skills updated!')
            setEditing(false)
            loadProfile()
        } else {
            toast.error('Failed to update skills')
        }
    }

    const handleLogout = () => {
        logout()
        localStorage.removeItem('cricksquad-auth')
        localStorage.removeItem('cricksquad-group')
        navigate('/login')
        toast.success('Logged out!')
    }

    if (isLoading) return <LoadingSpinner message="Loading profile..." />

    const SkillBar = ({ label, value, color }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-bold text-gray-900">{value}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    )

    return (
        <div className="space-y-5">
            {/* Profile Header */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card text-center"
            >
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-primary-700">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    )}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-sm text-gray-500 capitalize">🏏 {user?.playerRole}</p>
                <p className="text-2xl font-bold text-primary-600 mt-2">⭐ {user?.overallRating}</p>

                {user?.attendance?.currentStreak > 0 && (
                    <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium mt-2">
                        🔥 {user.attendance.currentStreak} week streak
                    </div>
                )}
            </Motion.div>

            {/* Skills */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">🎯 Skills</h3>
                    {isOwnProfile && (
                        <button
                            onClick={() => {
                                setEditing(!editing)
                                setEditData({
                                    battingSkill: user.battingSkill,
                                    bowlingSkill: user.bowlingSkill,
                                    fieldingSkill: user.fieldingSkill,
                                    playerRole: user.playerRole
                                })
                            }}
                            className="text-xs text-primary-600 font-medium flex items-center gap-1"
                        >
                            <HiPencil /> Edit
                        </button>
                    )}
                </div>

                {editing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Batting: {editData.battingSkill}</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={editData.battingSkill}
                                onChange={(e) => setEditData({ ...editData, battingSkill: Number(e.target.value) })}
                                className="w-full accent-green-600"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Bowling: {editData.bowlingSkill}</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={editData.bowlingSkill}
                                onChange={(e) => setEditData({ ...editData, bowlingSkill: Number(e.target.value) })}
                                className="w-full accent-red-600"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Fielding: {editData.fieldingSkill}</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={editData.fieldingSkill}
                                onChange={(e) => setEditData({ ...editData, fieldingSkill: Number(e.target.value) })}
                                className="w-full accent-blue-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveSkills} className="btn-primary flex-1 text-sm">Save</button>
                            <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <SkillBar label="🏏 Batting" value={user?.battingSkill} color="bg-green-500" />
                        <SkillBar label="🎳 Bowling" value={user?.bowlingSkill} color="bg-red-500" />
                        <SkillBar label="🤲 Fielding" value={user?.fieldingSkill} color="bg-blue-500" />
                    </div>
                )}
            </Motion.div>

            {/* Season Stats */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
            >
                <h3 className="font-bold text-gray-900 mb-4">📊 Season Stats</h3>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Matches', value: stats?.totalMatches || 0, emoji: '🏏' },
                        { label: 'Runs', value: stats?.totalRuns || 0, emoji: '🏃' },
                        { label: 'Wickets', value: stats?.totalWickets || 0, emoji: '🎳' },
                        { label: 'Catches', value: stats?.totalCatches || 0, emoji: '🤲' },
                        { label: 'Highest', value: stats?.highestScore || 0, emoji: '🔥' },
                        { label: 'POTM', value: stats?.potmAwards || 0, emoji: '⭐' },
                        { label: 'Bat Avg', value: stats?.battingAverage || '0.0', emoji: '📈' },
                        { label: 'SR', value: stats?.strikeRate || '0.0', emoji: '⚡' },
                        { label: 'Attendance', value: stats?.attendancePercentage + '%' || '0%', emoji: '📅' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-lg mb-0.5">{stat.emoji}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                            <p className="text-[10px] text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </Motion.div>

            {/* AI Player Insight */}
            {aiInsight && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card bg-gradient-to-br from-purple-50 to-blue-50 !border-purple-100"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-purple-900">🤖 AI Analysis</h3>
                        <button
                            onClick={handleRegeneratePlayerInsight}
                            className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded"
                            disabled={aiRegenerating}
                        >{aiRegenerating ? 'Regenerating...' : 'Regenerate'}</button>
                    </div>
                    <p className="text-sm text-purple-800 mb-3">{aiInsight.overallAssessment}</p>

                    {aiInsight.funComparison && (
                        <div className="bg-white/60 rounded-xl px-4 py-2.5 mb-3">
                            <p className="text-sm text-purple-700 font-medium">🌟 {aiInsight.funComparison}</p>
                        </div>
                    )}

                    {aiInsight.strengths && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-green-700 mb-1">💪 Strengths:</p>
                            {aiInsight.strengths.map((s, i) => (
                                <p key={i} className="text-xs text-green-600 ml-2">✅ {s}</p>
                            ))}
                        </div>
                    )}

                    {aiInsight.areasToImprove && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-orange-700 mb-1">📈 Areas to Improve:</p>
                            {aiInsight.areasToImprove.map((a, i) => (
                                <p key={i} className="text-xs text-orange-600 ml-2">🎯 {a}</p>
                            ))}
                        </div>
                    )}

                    {aiInsight.tip && (
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-700">💡 Pro tip: {aiInsight.tip}</p>
                        </div>
                    )}

                    {aiInsight.prediction && (
                        <p className="text-xs text-purple-500 mt-2 font-medium">
                            🔮 {aiInsight.prediction}
                        </p>
                    )}
                </Motion.div>
            )}

            {/* Logout */}
            {isOwnProfile && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <button
                        onClick={handleLogout}
                        className="btn-danger w-full flex items-center justify-center gap-2"
                    >
                        <HiLogout /> Logout
                    </button>
                </Motion.div>
            )}
        </div>
    )
}

export default ProfilePage