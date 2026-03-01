import { Link, useNavigate } from 'react-router-dom'
import { GiCricketBat } from 'react-icons/gi'
import { HiUserGroup, HiClipboardCheck, HiChartBar, HiCurrencyRupee, HiPhotograph, HiLightningBolt } from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'
import api from '../services/api'
import { useEffect } from 'react'

const features = [
    { icon: <HiClipboardCheck />, title: 'Quick RSVP', desc: 'One tap to confirm. No more WhatsApp chaos.' },
    { icon: <HiUserGroup />, title: 'Smart Teams', desc: 'AI-balanced teams based on skill ratings.' },
    { icon: <HiCurrencyRupee />, title: 'Split Expenses', desc: 'Track who owes what. Send reminders.' },
    { icon: <HiChartBar />, title: 'Stats & Leaderboard', desc: 'Track runs, wickets, and POTM awards.' },
    { icon: <HiPhotograph />, title: 'Match Gallery', desc: 'Share photos and memories from every game.' },
    { icon: <HiLightningBolt />, title: 'AI Insights', desc: 'Match summaries, player analysis, predictions.' },
]

const LandingPage = () => {
    const navigate = useNavigate();
    const stored = localStorage.getItem('cricksquad-auth')

    useEffect(() => {
        const isAuthenticted = async () => {
            try {
                if (!stored) return
                const { data } = await api.get('/auth/me');
                if (data?.success) {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Error checking authentication:', err);
            }
        }
        isAuthenticted();
    }, [navigate, stored]);
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-20 left-10 text-9xl">🏏</div>
                    <div className="absolute top-40 right-10 text-7xl">🏐</div>
                    <div className="absolute bottom-20 left-1/3 text-8xl">⚡</div>
                </div>

                <div className="relative max-w-lg mx-auto px-6 pt-16 pb-12 text-center">
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <GiCricketBat className="text-5xl text-green-300" />
                            <h1 className="text-4xl font-display font-extrabold text-white">
                                CrickSquad
                            </h1>
                        </div>

                        <p className="text-xl text-green-100 font-medium mb-2">
                            Less WhatsApp. More Cricket.
                        </p>
                        <p className="text-green-300 text-sm mb-10 max-w-xs mx-auto">
                            The all-in-one app for weekend cricket groups. RSVP, teams, scores, expenses — sorted.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                to="/register"
                                className="bg-white text-green-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all active:scale-95 shadow-xl"
                            >
                                🏏 Get Started Free
                            </Link>
                            <Link
                                to="/login"
                                className="bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all active:scale-95 border border-white/20"
                            >
                                Sign In
                            </Link>
                        </div>
                    </Motion.div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-y border-white/10">
                <div className="max-w-lg mx-auto px-6 py-5 grid grid-cols-3 gap-4 text-center">
                    {[
                        { num: '500+', label: 'Groups' },
                        { num: '10K+', label: 'Matches' },
                        { num: '50K+', label: 'Players' },
                    ].map((stat, i) => (
                        <Motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                        >
                            <div className="text-2xl font-bold text-white">{stat.num}</div>
                            <div className="text-green-300 text-xs">{stat.label}</div>
                        </Motion.div>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-6 py-12">
                <h2 className="text-2xl font-display font-bold text-white text-center mb-8">
                    Everything Your Cricket Group Needs
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, i) => (
                        <Motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
                        >
                            <div className="text-3xl text-green-300 mb-3">{feature.icon}</div>
                            <h3 className="font-bold text-white text-sm mb-1">{feature.title}</h3>
                            <p className="text-green-300 text-xs leading-relaxed">{feature.desc}</p>
                        </Motion.div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 py-12">
                <div className="max-w-lg mx-auto px-6">
                    <h2 className="text-2xl font-display font-bold text-white text-center mb-8">
                        How It Works
                    </h2>

                    <div className="space-y-6">
                        {[
                            { step: '1', title: 'Create Your Group', desc: 'Set up in 30 seconds. Share the join code.' },
                            { step: '2', title: 'RSVP for Matches', desc: 'One tap to confirm. Everyone sees the count.' },
                            { step: '3', title: 'Auto-Balance Teams', desc: 'AI creates fair teams. No more arguments.' },
                            { step: '4', title: 'Play & Track', desc: 'Log scores. See leaderboards. Celebrate wins!' },
                        ].map((item, i) => (
                            <Motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.15 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{item.title}</h3>
                                    <p className="text-green-300 text-sm">{item.desc}</p>
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-display font-bold text-white mb-4">
                    Ready to Play? 🏏
                </h2>
                <p className="text-green-300 mb-8">
                    Your cricket group deserves better than WhatsApp chaos
                </p>
                <Link
                    to="/register"
                    className="inline-block bg-white text-green-800 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all active:scale-95 shadow-xl"
                >
                    Create Your Squad Now
                </Link>

                <p className="text-green-400 text-xs mt-6">
                    Free forever • No credit card required
                </p>
            </div>
        </div>
    )
}

export default LandingPage