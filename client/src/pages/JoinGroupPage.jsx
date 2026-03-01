import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroupStore } from '../store/groupStore'
import toast from 'react-hot-toast'
import { motion as Motion } from 'framer-motion'

const JoinGroupPage = () => {
    const navigate = useNavigate()
    const { joinGroup } = useGroupStore()
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!code.trim()) {
            toast.error('Please enter a group code')
            return
        }
        setIsLoading(true)
        const result = await joinGroup(code.trim().toUpperCase())
        setIsLoading(false)

        if (result.success) {
            toast.success(`🎉 Joined "${result.data.name}" successfully!`)
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
                <h1 className="text-2xl font-display font-bold text-gray-900">Join a Squad</h1>
                <p className="text-gray-500 text-sm mt-1">Enter the group code shared by your friend</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SUN2024"
                        className="input-field text-center font-mono text-2xl tracking-[0.3em] uppercase"
                        maxLength={10}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className="btn-primary w-full disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Joining...
                        </span>
                    ) : (
                        '🔗 Join Squad'
                    )}
                </button>
            </form>

            <div className="card bg-blue-50 !border-blue-100">
                <h3 className="font-bold text-blue-900 text-sm mb-2">💡 How to get a code?</h3>
                <p className="text-blue-700 text-sm">
                    Ask your group admin to share the group code. They can find it on their dashboard or in group settings.
                </p>
            </div>
        </Motion.div>
    )
}

export default JoinGroupPage