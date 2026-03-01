import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { GiCricketBat } from 'react-icons/gi'
import { HiUser, HiMail, HiLockClosed, HiPhone, HiEye, HiEyeOff } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { motion as Motion } from 'framer-motion'

const roles = [
    { value: 'batsman', label: '🏏 Batsman' },
    { value: 'bowler', label: '🎳 Bowler' },
    { value: 'allrounder', label: '⭐ All-rounder' },
    { value: 'keeper', label: '🧤 Keeper' },
]

const RegisterPage = () => {
    const navigate = useNavigate()
    const { register, isLoading } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        playerRole: 'batsman'
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill in all required fields')
            return
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        const result = await register(formData)

        if (result.success && result.requiresVerification) {
            toast.success(result.message || 'Registered — please verify your email')
            navigate('/login')
        } else if (result.success) {
            toast.success('Account created! Welcome to CrickSquad! 🏏')
            navigate('/dashboard')
        } else {
            toast.error(result.message)
        }
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <GiCricketBat className="text-3xl text-primary-600" />
                    <span className="font-display font-bold text-2xl text-gray-900">CrickSquad</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Join the Squad!</h1>
                <p className="text-gray-500 text-sm mt-1">Create your cricket profile</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                        <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Virat Kohli"
                            className="input-field pl-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <div className="relative">
                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="virat@email.com"
                            className="input-field pl-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <div className="relative">
                        <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="input-field pl-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 6 characters"
                            className="input-field pl-11 pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showPassword ? <HiEyeOff /> : <HiEye />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Playing Role</label>
                    <div className="grid grid-cols-2 gap-2">
                        {roles.map(role => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, playerRole: role.value })}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${formData.playerRole === role.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating account...
                        </span>
                    ) : (
                        '🏏 Create Account'
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                    Sign In
                </Link>
            </p>
        </Motion.div>
    )
}

export default RegisterPage