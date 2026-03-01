import { useEffect, useState, startTransition } from 'react'
import { useGroupStore } from '../store/groupStore'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { HiPlus, HiSpeakerphone } from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'

const AnnouncementsPage = () => {
    const { currentGroup, isCurrentUserAdmin } = useGroupStore()
    const [announcements, setAnnouncements] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'normal' })

    const loadAnnouncements = async () => {
        try {
            const { data } = await api.get(`/announcements/group/${currentGroup._id}`)
            console.log('Loaded announcements:', data.data)
            setAnnouncements(data.data)
        } catch (error) {
            toast.error('Failed to load announcements', error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (currentGroup) {
            startTransition(() => {
                loadAnnouncements()
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGroup])

    const handleCreate = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
            toast.error('Fill in all fields')
            return
        }
        try {
            await api.post('/announcements', {
                groupId: currentGroup._id,
                ...newAnnouncement
            })
            toast.success('Announcement posted! 📢')
            setShowCreate(false)
            setNewAnnouncement({ title: '', message: '', priority: 'normal' })
            loadAnnouncements()
        } catch (error) {
            toast.error(`${error.response?.data?.message || error.message || 'Unknown error'}`)
        }
    }

    if (isLoading) return <LoadingSpinner message="Loading announcements..." />

    return (
        <div className="space-y-5">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-xl font-display font-bold text-gray-900">📢 Announcements</h1>
                {isCurrentUserAdmin && (
                    <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1">
                        <HiPlus /> Post
                    </button>
                )}
            </Motion.div>

            {announcements.map((a, i) => (
                <Motion.div
                    key={a._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`card ${a.priority === 'urgent' ? '!border-red-200 bg-red-50' : ''}`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.priority === 'urgent' ? 'bg-red-100' : 'bg-primary-100'
                            }`}>
                            <HiSpeakerphone className={`text-lg ${a.priority === 'urgent' ? 'text-red-600' : 'text-primary-600'
                                }`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                                {a.priority === 'urgent' && (
                                    <span className="badge-red text-[10px]">🚨 URGENT</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{a.message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{a.author?.name}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </div>
                </Motion.div>
            ))}

            {announcements.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-4xl mb-3">📢</p>
                    <p className="text-gray-500">No announcements yet</p>
                </div>
            )}

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="📢 New Announcement">
                <div className="space-y-4 mb-16">
                    <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        placeholder="Title"
                        className="input-field"
                        maxLength={100}
                    />
                    <textarea
                        value={newAnnouncement.message}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                        placeholder="What do you want to announce?"
                        className="input-field resize-none"
                        rows={4}
                        maxLength={1000}
                    />
                    <div className="flex gap-2">
                        {['normal', 'urgent'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${newAnnouncement.priority === p
                                    ? p === 'urgent' ? 'bg-red-500 text-white border-red-500' : 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-600 border-gray-200'
                                    }`}
                            >
                                {p === 'urgent' ? '🚨 ' : '📢 '}{p}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCreate} className="btn-primary w-full">Post Announcement</button>
                </div>
            </Modal>
        </div>
    )
}

export default AnnouncementsPage