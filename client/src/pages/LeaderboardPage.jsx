import { useEffect, useState, startTransition } from 'react'
import { useGroupStore } from '../store/groupStore'
import userService from '../services/userService'
import aiService from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { motion as Motion } from 'framer-motion'

const categories = [
    { key: 'runs', label: '🏏 Runs', field: 'totalRuns' },
    { key: 'wickets', label: '🎳 Wickets', field: 'totalWickets' },
    { key: 'potm', label: '⭐ POTM', field: 'potmAwards' },
    { key: 'rating', label: '💪 Rating', field: 'overallRating' },
]

const medalEmojis = ['🥇', '🥈', '🥉']

const LeaderboardPage = () => {
    const { currentGroup } = useGroupStore()
    const [activeCategory, setActiveCategory] = useState('runs')
    const [leaderboard, setLeaderboard] = useState([])
    const [aiSummary, setAiSummary] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const loadLeaderboard = async () => {
        setIsLoading(true)
        try {
            const { data } = await userService.getLeaderboard(currentGroup._id, {
                category: activeCategory
            })
            setLeaderboard(data.data)
        } catch (error) {
            toast.error('Failed to load leaderboard', error)
        }
        setIsLoading(false)
    }
    useEffect(() => {
        if (currentGroup) {
            startTransition(() => {
                loadLeaderboard()
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGroup, activeCategory])



    const loadAISummary = async () => {
        try {
            const { data } = await aiService.seasonAnalytics(currentGroup._id)
            setAiSummary(data.data)
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to load AI summary'}`)
        }
    }

    useEffect(() => {
        if (currentGroup) loadAISummary()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGroup])

    const getStatValue = (entry) => {
        const cat = categories.find(c => c.key === activeCategory)
        if (!cat) return 0

        if (activeCategory === 'rating') return entry.player.overallRating
        if (activeCategory === 'attendance') return entry.stats.attendancePercentage + '%'

        return entry.stats[cat.field] || 0
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">🏆 Leaderboard</h1>
                <p className="text-sm text-gray-500 mt-1">{currentGroup?.name} — Season Stats</p>
            </Motion.div>

            {/* Category Tabs */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
                {categories.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.key
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </Motion.div>

            {/* Leaderboard */}
            {isLoading ? (
                <LoadingSpinner message="Loading stats..." />
            ) : (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card !p-0 overflow-hidden"
                >
                    {/* Top 3 */}
                    {leaderboard.length >= 3 && (
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5">
                            <div className="flex items-end justify-center gap-4">
                                {/* 2nd place */}
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-2">
                                        <span className="text-lg font-bold text-gray-700">
                                            {leaderboard[1]?.player?.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-900 truncate max-w-[70px]">
                                        {leaderboard[1]?.player?.name?.split(' ')[0]}
                                    </p>
                                    <p className="text-lg font-bold text-gray-700">{getStatValue(leaderboard[1])}</p>
                                    <p className="text-xl">🥈</p>
                                </div>

                                {/* 1st place */}
                                <div className="text-center -mt-4">
                                    <div className="w-18 h-18 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-2 ring-4 ring-yellow-400" style={{ width: '72px', height: '72px' }}>
                                        <span className="text-2xl font-bold text-yellow-600">
                                            {leaderboard[0]?.player?.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[80px]">
                                        {leaderboard[0]?.player?.name?.split(' ')[0]}
                                    </p>
                                    <p className="text-2xl font-bold text-yellow-600">{getStatValue(leaderboard[0])}</p>
                                    <p className="text-2xl">🥇</p>
                                </div>

                                {/* 3rd place */}
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-2">
                                        <span className="text-lg font-bold text-gray-700">
                                            {leaderboard[2]?.player?.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-900 truncate max-w-[70px]">
                                        {leaderboard[2]?.player?.name?.split(' ')[0]}
                                    </p>
                                    <p className="text-lg font-bold text-gray-700">{getStatValue(leaderboard[2])}</p>
                                    <p className="text-xl">🥉</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rest of list */}
                    <div className="divide-y divide-gray-50">
                        {leaderboard.map((entry, i) => (
                            <Motion.div
                                key={entry.player._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <span className="w-8 text-center text-sm font-bold text-gray-400">
                                    {i < 3 ? medalEmojis[i] : `#${i + 1}`}
                                </span>
                                <div className="flex items-center gap-3 flex-1 ml-2">
                                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary-700">
                                            {entry.player.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{entry.player.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{entry.player.playerRole}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">{getStatValue(entry)}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {entry.stats.totalMatches} matches
                                    </p>
                                </div>
                            </Motion.div>
                        ))}
                    </div>

                    {leaderboard.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-400">No stats yet. Play some matches!</p>
                        </div>
                    )}
                </Motion.div>
            )}

            {/* AI Season Summary */}
            {aiSummary && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card bg-gradient-to-br from-purple-50 to-blue-50 !border-purple-100"
                >
                    <h3 className="font-bold text-purple-900 mb-3">🤖 AI Season Summary</h3>
                    <p className="text-sm text-purple-800 mb-3">{aiSummary.seasonSummary}</p>

                    {aiSummary.awards && aiSummary.awards.length > 0 && (
                        <div className="space-y-2 mb-3">
                            <p className="text-xs font-bold text-purple-700">🏆 AI Awards:</p>
                            {aiSummary.awards.map((award, i) => (
                                <div key={i} className="bg-white/60 rounded-lg px-3 py-2 text-xs text-purple-800">
                                    <span className="font-bold">{award.title}</span> — {award.winner}
                                    <span className="text-purple-500 ml-1">({award.reason})</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {aiSummary.funFacts && (
                        <div className="space-y-1">
                            {aiSummary.funFacts.map((fact, i) => (
                                <p key={i} className="text-xs text-purple-600">💡 {fact}</p>
                            ))}
                        </div>
                    )}
                </Motion.div>
            )}
        </div>
    )
}

export default LeaderboardPage