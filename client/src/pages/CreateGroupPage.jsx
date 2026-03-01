import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroupStore } from '../store/groupStore'
import toast from 'react-hot-toast'
import { motion as Motion } from 'framer-motion'

const days = ['sunday', 'saturday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const CreateGroupPage = () => {
    const navigate = useNavigate()
    const { createGroup } = useGroupStore()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxPlayers: 25,
        settings: {
            matchDay: 'sunday',
            defaultTime: '07:00',
            defaultOvers: 20,
            minPlayers: 12,
            maxPlayersPerMatch: 22,
            rsvpDeadlineHours: 12
        }
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name.startsWith('settings.')) {
            const field = name.split('.')[1]
            setFormData({
                ...formData,
                settings: { ...formData.settings, [field]: value }
            })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Please enter a group name')
            return
        }
        setIsLoading(true)
        const result = await createGroup(formData)
        setIsLoading(false)

        if (result.success) {
            toast.success(`🏏 "${formData.name}" created! Share code: ${result.data.code}`)
            navigate('/dashboard')
        } else {
            toast.error(result.message)
        }
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Create Your Squad</h1>
                <p className="text-gray-500 text-sm mt-1">Set up your cricket group in seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Group Name */}
                <div className="card">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Sunday Strikers"
                        className="input-field"
                        maxLength={50}
                    />
                </div>

                {/* Description */}
                <div className="card">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Weekend cricket fun with the boys..."
                        className="input-field resize-none"
                        rows={3}
                        maxLength={500}
                    />
                </div>

                {/* Match Settings */}
                <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4">⚙️ Match Settings</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Default Match Day</label>
                            <div className="flex flex-wrap gap-2">
                                {days.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            settings: { ...formData.settings, matchDay: day }
                                        })}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${formData.settings.matchDay === day
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Default Time</label>
                                <input
                                    type="time"
                                    name="settings.defaultTime"
                                    value={formData.settings.defaultTime}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Overs</label>
                                <input
                                    type="number"
                                    name="settings.defaultOvers"
                                    value={formData.settings.defaultOvers}
                                    onChange={handleChange}
                                    min={5}
                                    max={50}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Players</label>
                                <input
                                    type="number"
                                    name="maxPlayers"
                                    value={formData.maxPlayers}
                                    onChange={handleChange}
                                    min={4}
                                    max={50}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Deadline (hrs before)</label>
                                <input
                                    type="number"
                                    name="settings.rsvpDeadlineHours"
                                    value={formData.settings.rsvpDeadlineHours}
                                    onChange={handleChange}
                                    min={1}
                                    max={72}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                        </span>
                    ) : (
                        '🏏 Create Squad'
                    )}
                </button>
            </form>
        </Motion.div>
    )
}

export default CreateGroupPage