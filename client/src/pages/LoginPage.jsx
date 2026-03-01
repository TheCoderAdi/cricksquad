import { useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { GiCricketBat } from 'react-icons/gi'
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { motion as Motion } from 'framer-motion'

const LoginPage = () => {
    const navigate = useNavigate()
    const { login, isLoading } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showResend, setShowResend] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields')
            return
        }

        const result = await login(formData)

        if (result.success) {
            toast.success('Welcome back! 🏏')
            navigate('/dashboard')
        } else {
            toast.error(result.message)
            if (result.message && result.message.toLowerCase().includes('not verified')) {
                setShowResend(true)
            }
        }
    }

    const handleResend = async () => {
        if (!formData.email) {
            toast.error('Please enter your email to resend verification')
            return
        }
        setResendLoading(true)
        try {
            const { data } = await api.post('/auth/resend-verification', { email: formData.email })
            toast.success(data.message || 'Verification email resent')
            setShowResend(false)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend verification')
        }
        setResendLoading(false)
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <GiCricketBat className="text-3xl text-primary-600" />
                    <span className="font-display font-bold text-2xl text-gray-900">CrickSquad</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="input-field pl-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
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

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            {showResend && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Your email is not verified yet.</p>
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="btn-secondary text-sm"
                    >
                        {resendLoading ? 'Sending...' : 'Resend verification email'}
                    </button>
                </div>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                    Sign Up
                </Link>
            </p>
        </Motion.div>
    )
}

export default LoginPage