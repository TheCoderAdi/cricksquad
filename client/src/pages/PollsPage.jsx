import { useEffect, useState, startTransition } from 'react'
import { useGroupStore } from '../store/groupStore'
import pollService from '../services/pollService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { HiPlus } from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'

const PollsPage = () => {
    const { currentGroup, isCurrentUserAdmin } = useGroupStore()
    const { user } = useAuthStore()
    const [polls, setPolls] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [actionLoadingId, setActionLoadingId] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], deadlineHours: 24 })
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [pollToDelete, setPollToDelete] = useState(null)

    const loadPolls = async () => {
        try {
            const { data } = await pollService.getByGroup(currentGroup._id)
            setPolls(data.data)
        } catch (error) {
            toast.error('Failed to load polls', error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (currentGroup) {
            startTransition(() => {
                loadPolls()
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGroup])

    const handleCreatePoll = async () => {
        if (!newPoll.question.trim()) {
            toast.error('Enter a question')
            return
        }
        const validOptions = newPoll.options.filter(o => o.trim())
        if (validOptions.length < 2) {
            toast.error('Add at least 2 options')
            return
        }

        setIsLoading(true)
        try {
            const deadline = new Date(Date.now() + newPoll.deadlineHours * 60 * 60 * 1000)
            await pollService.create({
                groupId: currentGroup._id,
                question: newPoll.question,
                options: validOptions,
                deadline
            })
            toast.success('Poll created! 📊')
            setShowCreate(false)
            setNewPoll({ question: '', options: ['', ''], deadlineHours: 24 })
            loadPolls()
        } catch (error) {
            toast.error('Failed to create poll', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVote = async (pollId, optionIndex) => {
        try {
            await pollService.vote(pollId, optionIndex)
            toast.success('Vote recorded! ✅')
            loadPolls()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote')
        }
    }

    const handleClosePoll = async (pollId) => {
        try {
            setActionLoadingId(pollId)
            await pollService.close(pollId)
            toast.success('Poll closed')
            await loadPolls()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close poll')
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleDeletePoll = (pollId) => {
        setPollToDelete(pollId)
        setShowDeleteConfirm(true)
    }

    const confirmDeletePoll = async () => {
        if (!pollToDelete) return
        try {
            setActionLoadingId(pollToDelete)
            setShowDeleteConfirm(false)
            await pollService.delete(pollToDelete)
            toast.success('Poll deleted')
            setPollToDelete(null)
            await loadPolls()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete poll')
        } finally {
            setActionLoadingId(null)
        }
    }

    if (isLoading) return <LoadingSpinner message="Loading polls..." />

    return (
        <div className="space-y-5">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-xl font-display font-bold text-gray-900">📊 Polls</h1>
                {
                    isCurrentUserAdmin() && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1">
                            <HiPlus /> New Poll
                        </button>
                    )
                }
            </Motion.div>

            {polls.map((poll, i) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)
                const userVotedIndex = poll.options.findIndex(opt =>
                    opt.votes.some(v => (v._id || v) === user?._id)
                )

                return (
                    <Motion.div
                        key={poll._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="card"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-gray-900 text-sm flex-1">{poll.question}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`badge text-xs ${poll.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                                    {poll.status}
                                </span>
                                {isCurrentUserAdmin() && (
                                    <>
                                        {poll.status === 'active' && (
                                            <button
                                                onClick={() => handleClosePoll(poll._id)}
                                                className="text-xs bg-yellow-50 px-2 py-1 rounded"
                                                disabled={actionLoadingId === poll._id}
                                            >
                                                {actionLoadingId === poll._id ? 'Closing...' : 'Close'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeletePoll(poll._id)}
                                            className="text-xs bg-red-50 px-2 py-1 rounded"
                                            disabled={actionLoadingId === poll._id}
                                        >
                                            {actionLoadingId === poll._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-3">
                            {poll.options.map((option, optIdx) => {
                                const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
                                const isMyVote = optIdx === userVotedIndex

                                return (
                                    <button
                                        key={optIdx}
                                        onClick={() => poll.status === 'active' && handleVote(poll._id, optIdx)}
                                        disabled={poll.status === 'closed'}
                                        className={`w-full text-left relative overflow-hidden rounded-xl border transition-all ${isMyVote ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div
                                            className={`absolute inset-y-0 left-0 ${isMyVote ? 'bg-primary-100' : 'bg-gray-100'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                        <div className="relative flex items-center justify-between px-4 py-2.5">
                                            <span className="text-sm font-medium text-gray-900">
                                                {isMyVote && '✅ '}{option.text}
                                            </span>
                                            <span className="text-xs font-bold text-gray-500">
                                                {option.votes.length} ({percentage}%)
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{totalVotes} votes</span>
                            <span>
                                {poll.status === 'active'
                                    ? `Closes ${formatDistanceToNow(new Date(poll.deadline), { addSuffix: true })}`
                                    : 'Closed'
                                }
                            </span>
                        </div>
                    </Motion.div>
                )
            })}

            {polls.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-gray-500">No polls yet. Create one!</p>
                </div>
            )}

            {/* Create Poll Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="📊 Create Poll">
                <div className="space-y-4 mb-16">
                    <input
                        type="text"
                        value={newPoll.question}
                        onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                        placeholder="Ask a question..."
                        className="input-field"
                        maxLength={200}
                    />

                    {newPoll.options.map((opt, i) => (
                        <input
                            key={i}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                                const options = [...newPoll.options]
                                options[i] = e.target.value
                                setNewPoll({ ...newPoll, options })
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="input-field"
                        />
                    ))}

                    <button
                        type="button"
                        onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                        className="text-sm text-primary-600 font-medium"
                    >
                        + Add Option
                    </button>

                    <div>
                        <label className="text-sm text-gray-700 font-medium block mb-1">Deadline (hours)</label>
                        <input
                            type="number"
                            value={newPoll.deadlineHours}
                            onChange={(e) => setNewPoll({ ...newPoll, deadlineHours: Number(e.target.value) })}
                            className="input-field"
                            min={1}
                            max={168}
                        />
                    </div>

                    <button onClick={handleCreatePoll} className={`btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2 || isLoading}>
                        {isLoading ? 'Creating...' : '📊 Create Poll'}
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setPollToDelete(null); }} title="Confirm delete">
                <div className="space-y-4 mb-16">
                    <p>Are you sure you want to delete this poll? This action cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowDeleteConfirm(false); setPollToDelete(null); }} className="btn-secondary">Cancel</button>
                        <button onClick={confirmDeletePoll} className={`btn-primary ${actionLoadingId ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!!actionLoadingId}>
                            {actionLoadingId ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default PollsPage