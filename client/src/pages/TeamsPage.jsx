import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import matchService from '../services/matchService'
import aiService from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { HiRefresh, HiShare, HiLockClosed, HiLightningBolt } from 'react-icons/hi'
import { startTransition } from 'react'
import { useGroupStore } from '../store/groupStore'

const TeamsPage = () => {
    const { matchId } = useParams()
    const { currentGroup } = useGroupStore()
    const [match, setMatch] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [tossResult, setTossResult] = useState(null)
    const [tossing, setTossing] = useState(false)

    const loadMatch = async () => {
        try {
            const { data } = await matchService.getById(matchId)
            setMatch(data.data)
        } catch (error) {
            toast.error('Failed to load match', error)
        }
        setIsLoading(false)
    }
    useEffect(() => {
        startTransition(() => {
            loadMatch()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId])


    const handleGenerateTeams = async () => {
        setGenerating(true)
        try {
            await matchService.generateTeams(matchId, {
                teamAName: 'Team Thunder ⚡',
                teamBName: 'Team Storm 🌊',
                groupId: currentGroup._id
            })
            toast.success('Teams generated! ⚖️')
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
            loadMatch()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate teams')
        }
        setGenerating(false)
    }

    const handleAIGenerate = async () => {
        setAiGenerating(true)
        try {
            const { data } = await aiService.balanceTeams(matchId)
            setAiAnalysis(data.data)
            toast.success('AI analysis ready! 🤖')
        } catch (error) {
            toast.error('AI analysis failed', error)
        }
        setAiGenerating(false)
    }

    const handleToss = async () => {
        setTossing(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        try {
            const { data } = await matchService.performToss(matchId, { groupId: currentGroup._id })
            setTossResult(data.data)
            toast.success(`${data.data.winnerName} won the toss! 🎉`)
        } catch (error) {
            toast.error('Toss failed', error)
        } finally {
            setTossing(false)
        }
    }

    const handleShare = () => {
        if (!match) return
        const text = `🏏 ${match.teamA?.name} vs ${match.teamB?.name}\n\n` +
            `Team A (Rating: ${match.teamA?.totalRating}):\n${match.teamA?.players?.map(p => `• ${p.name}`).join('\n')}\n\n` +
            `Team B (Rating: ${match.teamB?.totalRating}):\n${match.teamB?.players?.map(p => `• ${p.name}`).join('\n')}\n\n` +
            `Balance diff: ${Math.abs((match.teamA?.totalRating || 0) - (match.teamB?.totalRating || 0)).toFixed(1)} pts`

        if (navigator.share) {
            navigator.share({ title: 'CrickSquad Teams', text })
        } else {
            navigator.clipboard.writeText(text)
            toast.success('Teams copied to clipboard!')
        }
    }

    if (isLoading) return <LoadingSpinner message="Loading teams..." />
    if (!match) return <div className="text-center py-10">Match not found</div>

    const hasTeams = match.teamA?.players?.length > 0 && match.teamB?.players?.length > 0
    const balanceDiff = Math.abs((match.teamA?.totalRating || 0) - (match.teamB?.totalRating || 0))

    return (
        <div className="space-y-5">
            {showConfetti && <confetti recycle={false} numberOfPieces={200} />}

            {/* Header */}
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">⚖️ Team Balancer</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {hasTeams ? 'Teams are ready!' : 'Generate balanced teams from confirmed players'}
                </p>
            </Motion.div>

            {/* Generate Buttons */}
            {!hasTeams && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                >
                    <button
                        onClick={handleGenerateTeams}
                        disabled={generating}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Balancing teams...
                            </>
                        ) : (
                            <>⚖️ Auto-Balance Teams</>
                        )}
                    </button>

                    <button
                        onClick={handleAIGenerate}
                        disabled={aiGenerating}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                        {aiGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                AI Analyzing...
                            </>
                        ) : (
                            <>
                                <HiLightningBolt className="text-purple-600" />
                                🤖 AI Smart Balance
                            </>
                        )}
                    </button>
                </Motion.div>
            )}

            {/* AI Analysis */}
            {aiAnalysis && (
                <Motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card bg-gradient-to-br from-purple-50 to-blue-50 !border-purple-100"
                >
                    <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <HiLightningBolt className="text-purple-600" />
                        AI Analysis
                    </h3>
                    <p className="text-sm text-purple-800 mb-3">{aiAnalysis.analysis}</p>
                    {aiAnalysis.prediction && (
                        <p className="text-xs text-purple-600 font-medium bg-purple-100 rounded-lg px-3 py-2">
                            🔮 {aiAnalysis.prediction}
                        </p>
                    )}
                </Motion.div>
            )}

            {/* Teams Display */}
            {hasTeams && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Team A */}
                        <Motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card !p-4"
                        >
                            <div className="text-center mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">{match.teamA.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Rating: <span className="font-bold text-primary-600">{match.teamA.totalRating}</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                {match.teamA.players?.map((player, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-xs font-bold text-blue-700">
                                                {player.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">{player.name}</p>
                                            <p className="text-[10px] text-gray-400 capitalize">{player.playerRole}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">{player.overallRating}</span>
                                    </div>
                                ))}
                            </div>
                        </Motion.div>

                        {/* Team B */}
                        <Motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card !p-4"
                        >
                            <div className="text-center mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">{match.teamB.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Rating: <span className="font-bold text-primary-600">{match.teamB.totalRating}</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                {match.teamB.players?.map((player, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                                            <span className="text-xs font-bold text-orange-700">
                                                {player.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">{player.name}</p>
                                            <p className="text-[10px] text-gray-400 capitalize">{player.playerRole}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">{player.overallRating}</span>
                                    </div>
                                ))}
                            </div>
                        </Motion.div>
                    </div>

                    {/* Balance Meter */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card text-center"
                    >
                        <p className="text-sm text-gray-500 mb-2">Balance Difference</p>
                        <p className={`text-3xl font-bold ${balanceDiff < 5 ? 'text-green-600' : balanceDiff < 15 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {balanceDiff.toFixed(1)} pts
                        </p>
                        <p className={`text-xs font-medium mt-1 ${balanceDiff < 5 ? 'text-green-500' : balanceDiff < 15 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                            {balanceDiff < 5 ? '✅ Nearly perfect balance!' :
                                balanceDiff < 15 ? '👍 Good balance' : '⚠️ Could be more balanced'}
                        </p>
                    </Motion.div>

                    {/* Toss */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="card text-center"
                    >
                        <h3 className="font-bold text-gray-900 mb-3">🎲 Digital Toss</h3>
                        {tossResult || match?.toss?.winner ? (
                            <div className="bg-primary-50 rounded-xl p-4">
                                <p className="text-lg font-bold text-primary-700">
                                    🎉 {tossResult?.winnerName || (match?.toss?.winner === 'teamB' ? 'Team Thunder ⚡' : 'Team Storm 🌊')} won the toss!
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleToss}
                                disabled={tossing}
                                className="btn-primary"
                            >
                                {tossing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="text-2xl animate-spin-slow">🪙</span>
                                        Flipping...
                                    </span>
                                ) : '🪙 Flip Coin'}
                            </button>
                        )}
                    </Motion.div>

                    {/* Action Buttons */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-3"
                    >
                        <button
                            onClick={handleGenerateTeams}
                            disabled={generating}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                        >
                            <HiRefresh /> Reshuffle
                        </button>
                        <button
                            onClick={handleShare}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                        >
                            <HiShare /> Share Teams
                        </button>
                    </Motion.div>
                </>
            )}
        </div>
    )
}

export default TeamsPage