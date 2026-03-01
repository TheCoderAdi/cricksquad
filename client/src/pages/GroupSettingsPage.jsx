import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroupStore } from '../store/groupStore'
import { useAuthStore } from '../store/authStore'
import Modal from '../components/common/Modal'
import matchService from '../services/matchService'
import toast from 'react-hot-toast'
import { HiPlus, HiUserGroup, HiCog } from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'

const GroupSettingsPage = () => {
    const navigate = useNavigate()
    const { currentGroup } = useGroupStore()
    const { user } = useAuthStore()
    const [showCreateMatch, setShowCreateMatch] = useState(false)
    const [matchForm, setMatchForm] = useState({
        date: '', time: '07:00', overs: 20
    })
    const [creating, setCreating] = useState(false)

    if (!currentGroup) {
        return <div className="text-center py-10">No group selected</div>
    }

    const isAdmin = currentGroup.members?.some(
        m => (m.user?._id || m.user) === user?._id && m.role === 'admin'
    )

    const handleCreateMatch = async () => {
        if (!matchForm.date) {
            toast.error('Select a date')
            return
        }
        setCreating(true)
        try {
            await matchService.create({
                groupId: currentGroup._id,
                date: matchForm.date,
                time: matchForm.time,
                overs: matchForm.overs,
            })
            toast.success('Match created! 🏏')
            setShowCreateMatch(false)
            setMatchForm({ date: '', time: '07:00', overs: 20 })
            navigate('/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create match')
        }
        setCreating(false)
    }

    return (
        <div className="space-y-5">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">⚙️ Group Settings</h1>
                <p className="text-sm text-gray-500 mt-1">{currentGroup.name}</p>
            </Motion.div>

            {/* Group Info */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                <h3 className="font-bold text-gray-900 mb-3">📋 Group Info</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Group Name</span>
                        <span className="text-sm font-medium text-gray-900">{currentGroup.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Join Code</span>
                        <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono font-bold tracking-wider text-sm">
                                {currentGroup.code}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(currentGroup.code)
                                    toast.success('Code copied!')
                                }}
                                className="text-xs text-primary-600 font-medium"
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Members</span>
                        <span className="text-sm font-medium text-gray-900">
                            {currentGroup.members?.length || 0} / {currentGroup.maxPlayers}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Match Day</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                            {currentGroup.settings?.matchDay || 'Sunday'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Default Time</span>
                        <span className="text-sm font-medium text-gray-900">
                            {currentGroup.settings?.defaultTime || '07:00'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Overs</span>
                        <span className="text-sm font-medium text-gray-900">
                            {currentGroup.settings?.defaultOvers || 20}
                        </span>
                    </div>
                </div>
            </Motion.div>

            {/* Members List */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
            >
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <HiUserGroup className="text-primary-600" />
                    Members ({currentGroup.members?.length || 0})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {currentGroup.members?.map((member, i) => {
                        const memberUser = member.user
                        return (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                                        {memberUser?.avatar ? (
                                            <img src={memberUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-primary-700">
                                                {(memberUser?.name || 'U').charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {memberUser?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">{memberUser?.playerRole || 'player'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {member.role === 'admin' && (
                                        <span className="badge-blue text-[10px]">Admin</span>
                                    )}
                                    <span className="text-xs font-bold text-gray-400">⭐ {memberUser?.overallRating || 50}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Motion.div>

            {/* Admin Actions */}
            {isAdmin && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <HiCog className="text-gray-500" />
                        Admin Actions
                    </h3>

                    <button
                        onClick={() => setShowCreateMatch(true)}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <HiPlus /> Schedule New Match
                    </button>

                    <button
                        onClick={() => {
                            const shareText = `🏏 Join "${currentGroup.name}" on CrickSquad!\n\nJoin Code: ${currentGroup.code}\n\nDownload CrickSquad to manage your weekend cricket group!`
                            if (navigator.share) {
                                navigator.share({ title: 'Join CrickSquad', text: shareText })
                            } else {
                                navigator.clipboard.writeText(shareText)
                                toast.success('Invite message copied!')
                            }
                        }}
                        className="btn-secondary w-full"
                    >
                        📤 Share Invite Link
                    </button>
                </Motion.div>
            )}

            {/* Create Match Modal */}
            <Modal isOpen={showCreateMatch} onClose={() => setShowCreateMatch(false)} title="🏏 Schedule Match">
                <div className="space-y-4 mb-16">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Match Date *</label>
                        <input
                            type="date"
                            value={matchForm.date}
                            onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                            className="input-field"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input
                            type="time"
                            value={matchForm.time}
                            onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Overs</label>
                        <input
                            type="number"
                            value={matchForm.overs}
                            onChange={(e) => setMatchForm({ ...matchForm, overs: Number(e.target.value) })}
                            className="input-field"
                            min={5}
                            max={50}
                        />
                    </div>
                    <button
                        onClick={handleCreateMatch}
                        disabled={creating}
                        className="btn-primary w-full"
                    >
                        {creating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            '🏏 Create Match'
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default GroupSettingsPage