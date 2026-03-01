import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import matchService from '../services/matchService'
import aiService from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { HiPlus, HiLightningBolt } from 'react-icons/hi'
import { startTransition } from 'react'

const ScorecardPage = () => {
    const { matchId } = useParams()
    const [match, setMatch] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [_showEntryForm, setShowEntryForm] = useState(false)
    const [aiSummary, setAiSummary] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [potmSuggestion, setPotmSuggestion] = useState(null)
    const [seasonAnalytics, setSeasonAnalytics] = useState(null)
    const [seasonLoading, setSeasonLoading] = useState(false)

    // Scorecard form state
    const [scoreForm, setScoreForm] = useState({
        teamAScore: { runs: '', wickets: '', overs: '' },
        teamBScore: { runs: '', wickets: '', overs: '' },
        battingStats: [],
        bowlingStats: [],
        playerOfMatch: ''
    })

    // Individual stat entry
    const [newBatStat, setNewBatStat] = useState({
        player: '', runs: '', balls: '', fours: '', sixes: '', howOut: 'not out'
    })
    const [newBowlStat, setNewBowlStat] = useState({
        player: '', overs: '', runs: '', wickets: '', maidens: ''
    })

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

    const addBattingStat = () => {
        if (!newBatStat.player) {
            toast.error('Select a player')
            return
        }
        setScoreForm(prev => ({
            ...prev,
            battingStats: [...prev.battingStats, {
                ...newBatStat,
                runs: Number(newBatStat.runs) || 0,
                balls: Number(newBatStat.balls) || 0,
                fours: Number(newBatStat.fours) || 0,
                sixes: Number(newBatStat.sixes) || 0
            }]
        }))
        setNewBatStat({ player: '', runs: '', balls: '', fours: '', sixes: '', howOut: 'not out' })
        toast.success('Batting stat added')
    }

    const addBowlingStat = () => {
        if (!newBowlStat.player) {
            toast.error('Select a player')
            return
        }
        setScoreForm(prev => ({
            ...prev,
            bowlingStats: [...prev.bowlingStats, {
                ...newBowlStat,
                overs: Number(newBowlStat.overs) || 0,
                runs: Number(newBowlStat.runs) || 0,
                wickets: Number(newBowlStat.wickets) || 0,
                maidens: Number(newBowlStat.maidens) || 0
            }]
        }))
        setNewBowlStat({ player: '', overs: '', runs: '', wickets: '', maidens: '' })
        toast.success('Bowling stat added')
    }

    const handleSubmitScorecard = async () => {
        if (!scoreForm.teamAScore.runs || !scoreForm.teamBScore.runs) {
            toast.error('Please enter team scores')
            return
        }

        try {
            await matchService.submitScorecard(matchId, {
                teamAScore: {
                    runs: Number(scoreForm.teamAScore.runs),
                    wickets: Number(scoreForm.teamAScore.wickets) || 0,
                    overs: Number(scoreForm.teamAScore.overs) || 0
                },
                teamBScore: {
                    runs: Number(scoreForm.teamBScore.runs),
                    wickets: Number(scoreForm.teamBScore.wickets) || 0,
                    overs: Number(scoreForm.teamBScore.overs) || 0
                },
                battingStats: scoreForm.battingStats,
                bowlingStats: scoreForm.bowlingStats,
                playerOfMatch: scoreForm.playerOfMatch || null
            })

            toast.success('Scorecard saved! 🏏')
            setShowEntryForm(false)
            loadMatch()
        } catch (error) {
            toast.error('Failed to save scorecard', error)
        }
    }

    const handleAISummary = async () => {
        setAiLoading(true)
        try {
            const { data } = await aiService.matchSummary(matchId)
            setAiSummary(data.data)
            toast.success('AI summary generated! 🤖')
        } catch (error) {
            toast.error('Failed to generate summary', error)
        }
        setAiLoading(false)
    }

    const handleAIPotm = async () => {
        try {
            const { data } = await aiService.potmSuggestion(matchId)
            setPotmSuggestion(data.data)
        } catch (error) {
            toast.error('Failed to get POTM suggestion', error)
        }
    }

    const handleSeasonAnalytics = async () => {
        if (!match || !match.group) return toast.error('No group available for analytics')
        setSeasonLoading(true)
        try {
            const { data } = await aiService.seasonAnalytics(match.group)
            if (data?.success) {
                setSeasonAnalytics(data.data)
                toast.success('Season analytics generated')
            } else {
                toast.error(data?.message || 'Failed to generate analytics')
            }
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to fetch season analytics'}`)
        }
        setSeasonLoading(false)
    }

    if (isLoading) return <LoadingSpinner message="Loading scorecard..." />
    if (!match) return <div className="text-center py-10">Match not found</div>

    const hasScorecard = match.scorecard?.winner
    const allPlayers = [
        ...(match.teamA?.players || []),
        ...(match.teamB?.players || [])
    ]

    return (
        <div className="space-y-5">
            {/* Header */}
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">📊 Scorecard</h1>
            </Motion.div>

            {/* Match Result */}
            {hasScorecard ? (
                <>
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card bg-gradient-to-br from-primary-600 to-green-700 text-white !border-0"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-center flex-1">
                                <p className="font-bold text-sm text-green-100">{match.teamA?.name}</p>
                                <p className="text-3xl font-bold mt-1">
                                    {match.scorecard.teamAScore?.runs}/{match.scorecard.teamAScore?.wickets}
                                </p>
                                <p className="text-xs text-green-200">({match.scorecard.teamAScore?.overs} ov)</p>
                            </div>

                            <div className="px-3">
                                <span className="text-green-200 font-bold text-lg">vs</span>
                            </div>

                            <div className="text-center flex-1">
                                <p className="font-bold text-sm text-green-100">{match.teamB?.name}</p>
                                <p className="text-3xl font-bold mt-1">
                                    {match.scorecard.teamBScore?.runs}/{match.scorecard.teamBScore?.wickets}
                                </p>
                                <p className="text-xs text-green-200">({match.scorecard.teamBScore?.overs} ov)</p>
                            </div>
                        </div>

                        <div className="bg-white/20 rounded-xl px-4 py-2.5 text-center">
                            <p className="font-bold text-sm">
                                {match.scorecard.winner === 'tie' ? "🤝 It's a tie!" :
                                    `🏆 ${match.scorecard.winner === 'teamA' ? match.teamA?.name : match.teamB?.name} won by ${Math.abs(match.scorecard.teamAScore?.runs - match.scorecard.teamBScore?.runs)
                                    } runs`
                                }
                            </p>
                        </div>

                        {match.scorecard.playerOfMatch && (
                            <div className="text-center mt-3">
                                <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-xs font-bold">
                                    ⭐ POTM: {match.scorecard.playerOfMatch?.name}
                                </span>
                            </div>
                        )}
                    </Motion.div>

                    {/* Batting Stats Table */}
                    {match.scorecard.battingStats?.length > 0 && (
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card !p-0 overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm">🏏 Batting</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-gray-500 border-b border-gray-50">
                                            <th className="text-left px-4 py-2">Batter</th>
                                            <th className="text-center px-2 py-2">R</th>
                                            <th className="text-center px-2 py-2">B</th>
                                            <th className="text-center px-2 py-2">4s</th>
                                            <th className="text-center px-2 py-2">6s</th>
                                            <th className="text-center px-2 py-2">SR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {match.scorecard.battingStats.map((stat, i) => (
                                            <tr key={i} className="border-b border-gray-50 last:border-0">
                                                <td className="px-4 py-2.5">
                                                    <p className="text-sm font-medium text-gray-900">{stat.player?.name}</p>
                                                    <p className="text-[10px] text-gray-400">{stat.howOut}</p>
                                                </td>
                                                <td className="text-center text-sm font-bold text-gray-900">{stat.runs}</td>
                                                <td className="text-center text-xs text-gray-500">{stat.balls}</td>
                                                <td className="text-center text-xs text-gray-500">{stat.fours}</td>
                                                <td className="text-center text-xs text-gray-500">{stat.sixes}</td>
                                                <td className="text-center text-xs text-gray-500">
                                                    {stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(1) : '0.0'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Motion.div>
                    )}

                    {/* Bowling Stats Table */}
                    {match.scorecard.bowlingStats?.length > 0 && (
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="card !p-0 overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm">🎳 Bowling</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-gray-500 border-b border-gray-50">
                                            <th className="text-left px-4 py-2">Bowler</th>
                                            <th className="text-center px-2 py-2">O</th>
                                            <th className="text-center px-2 py-2">R</th>
                                            <th className="text-center px-2 py-2">W</th>
                                            <th className="text-center px-2 py-2">Econ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {match.scorecard.bowlingStats.map((stat, i) => (
                                            <tr key={i} className="border-b border-gray-50 last:border-0">
                                                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                                                    {stat.player?.name}
                                                </td>
                                                <td className="text-center text-xs text-gray-500">{stat.overs}</td>
                                                <td className="text-center text-xs text-gray-500">{stat.runs}</td>
                                                <td className="text-center text-sm font-bold text-gray-900">{stat.wickets}</td>
                                                <td className="text-center text-xs text-gray-500">
                                                    {stat.overs > 0 ? (stat.runs / stat.overs).toFixed(1) : '0.0'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Motion.div>
                    )}

                    {/* AI Match Summary */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {aiSummary ? (
                            <div className="card bg-gradient-to-br from-purple-50 to-blue-50 !border-purple-100">
                                <h3 className="font-bold text-purple-900 mb-2 text-lg">{aiSummary.headline}</h3>
                                <p className="text-sm text-purple-800 whitespace-pre-line mb-4">{aiSummary.summary}</p>

                                {aiSummary.highlights && (
                                    <div className="mb-3">
                                        <p className="text-xs font-bold text-purple-700 mb-1">🔥 Highlights:</p>
                                        {aiSummary.highlights.map((h, i) => (
                                            <p key={i} className="text-xs text-purple-600 ml-2 mb-1">• {h}</p>
                                        ))}
                                    </div>
                                )}

                                {aiSummary.funFacts && (
                                    <div>
                                        <p className="text-xs font-bold text-purple-700 mb-1">💡 Fun Facts:</p>
                                        {aiSummary.funFacts.map((f, i) => (
                                            <p key={i} className="text-xs text-purple-500 ml-2 mb-1">• {f}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleAISummary}
                                disabled={aiLoading}
                                className="btn-secondary w-full flex items-center justify-center gap-2"
                            >
                                {aiLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <HiLightningBolt className="text-purple-600" />
                                        🤖 Generate AI Match Report
                                    </>
                                )}
                            </button>
                        )}
                        {/* Season analytics button */}
                        <div className="mt-3">
                            <button
                                onClick={handleSeasonAnalytics}
                                disabled={seasonLoading}
                                className="btn-outline w-full flex items-center justify-center gap-2"
                            >
                                {seasonLoading ? 'Generating analytics...' : '🔎 Generate Season Analytics'}
                            </button>

                            {seasonAnalytics && (
                                <div className="mt-4 card">
                                    <h4 className="font-bold mb-2">Season Summary</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{seasonAnalytics.seasonSummary}</p>

                                    <div className="mt-3">
                                        <h5 className="font-bold text-sm mb-2">Key Stats</h5>
                                        <div className="space-y-2">
                                            {seasonAnalytics.keyStats?.map((s, i) => (
                                                <div key={i} className="text-sm">
                                                    <strong>{s.label}:</strong> {s.value}
                                                    {s.insight && <div className="text-xs text-gray-500">{s.insight}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {seasonAnalytics.awards && (
                                        <div className="mt-3">
                                            <h5 className="font-bold text-sm mb-2">Awards</h5>
                                            <ul className="list-disc ml-5 text-sm">
                                                {seasonAnalytics.awards.map((a, i) => (
                                                    <li key={i}><strong>{a.title}</strong> — {a.winner} <em className="text-xs text-gray-500">({a.reason})</em></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {seasonAnalytics.trends && (
                                        <div className="mt-3">
                                            <h5 className="font-bold text-sm mb-2">Trends</h5>
                                            <ul className="list-disc ml-5 text-sm">
                                                {seasonAnalytics.trends.map((t, i) => <li key={i}>{t}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {seasonAnalytics.funFacts && (
                                        <div className="mt-3">
                                            <h5 className="font-bold text-sm mb-2">Fun Facts</h5>
                                            <ul className="list-disc ml-5 text-sm">
                                                {seasonAnalytics.funFacts.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </Motion.div>
                </>
            ) : (
                /* Scorecard Entry Form */
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="card">
                        <h3 className="font-bold text-gray-900 mb-4">📝 Enter Scorecard</h3>

                        {/* Team A Score */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                {match.teamA?.name || 'Team A'} Score
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="number"
                                    placeholder="Runs"
                                    value={scoreForm.teamAScore.runs}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamAScore: { ...prev.teamAScore, runs: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Wickets"
                                    value={scoreForm.teamAScore.wickets}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamAScore: { ...prev.teamAScore, wickets: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                    max={10}
                                />
                                <input
                                    type="number"
                                    placeholder="Overs"
                                    value={scoreForm.teamAScore.overs}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamAScore: { ...prev.teamAScore, overs: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                    step={0.1}
                                />
                            </div>
                        </div>

                        {/* Team B Score */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                {match.teamB?.name || 'Team B'} Score
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="number"
                                    placeholder="Runs"
                                    value={scoreForm.teamBScore.runs}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamBScore: { ...prev.teamBScore, runs: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Wickets"
                                    value={scoreForm.teamBScore.wickets}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamBScore: { ...prev.teamBScore, wickets: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                    max={10}
                                />
                                <input
                                    type="number"
                                    placeholder="Overs"
                                    value={scoreForm.teamBScore.overs}
                                    onChange={(e) => setScoreForm(prev => ({
                                        ...prev,
                                        teamBScore: { ...prev.teamBScore, overs: e.target.value }
                                    }))}
                                    className="input-field text-center text-sm"
                                    step={0.1}
                                />
                            </div>
                        </div>

                        {/* Add Batting Stats */}
                        <div className="border-t border-gray-100 pt-4 mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🏏 Add Batting Stats</p>
                            <div className="space-y-2">
                                <select
                                    value={newBatStat.player}
                                    onChange={(e) => setNewBatStat({ ...newBatStat, player: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    <option value="">Select Player</option>
                                    {allPlayers.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-4 gap-2">
                                    <input type="number" placeholder="Runs" value={newBatStat.runs}
                                        onChange={(e) => setNewBatStat({ ...newBatStat, runs: e.target.value })}
                                        className="input-field text-center text-xs" />
                                    <input type="number" placeholder="Balls" value={newBatStat.balls}
                                        onChange={(e) => setNewBatStat({ ...newBatStat, balls: e.target.value })}
                                        className="input-field text-center text-xs" />
                                    <input type="number" placeholder="4s" value={newBatStat.fours}
                                        onChange={(e) => setNewBatStat({ ...newBatStat, fours: e.target.value })}
                                        className="input-field text-center text-xs" />
                                    <input type="number" placeholder="6s" value={newBatStat.sixes}
                                        onChange={(e) => setNewBatStat({ ...newBatStat, sixes: e.target.value })}
                                        className="input-field text-center text-xs" />
                                </div>
                                <button type="button" onClick={addBattingStat} className="btn-secondary w-full text-xs">
                                    <HiPlus className="inline mr-1" /> Add Batter
                                </button>
                            </div>

                            {/* Added batters */}
                            {scoreForm.battingStats.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {scoreForm.battingStats.map((stat, i) => {
                                        const playerName = allPlayers.find(p => p._id === stat.player)?.name || 'Unknown'
                                        return (
                                            <div key={i} className="flex items-center justify-between bg-green-50 px-3 py-1.5 rounded-lg text-xs">
                                                <span className="font-medium">{playerName}</span>
                                                <span>{stat.runs}({stat.balls}) {stat.fours}x4 {stat.sixes}x6</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Bowling Stats */}
                        <div className="border-t border-gray-100 pt-4 mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🎳 Add Bowling Stats</p>
                            <div className="space-y-2">
                                <select
                                    value={newBowlStat.player}
                                    onChange={(e) => setNewBowlStat({ ...newBowlStat, player: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    <option value="">Select Player</option>
                                    {allPlayers.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="number" placeholder="Overs" value={newBowlStat.overs}
                                        onChange={(e) => setNewBowlStat({ ...newBowlStat, overs: e.target.value })}
                                        className="input-field text-center text-xs" step={0.1} />
                                    <input type="number" placeholder="Runs" value={newBowlStat.runs}
                                        onChange={(e) => setNewBowlStat({ ...newBowlStat, runs: e.target.value })}
                                        className="input-field text-center text-xs" />
                                    <input type="number" placeholder="Wickets" value={newBowlStat.wickets}
                                        onChange={(e) => setNewBowlStat({ ...newBowlStat, wickets: e.target.value })}
                                        className="input-field text-center text-xs" />
                                </div>
                                <button type="button" onClick={addBowlingStat} className="btn-secondary w-full text-xs">
                                    <HiPlus className="inline mr-1" /> Add Bowler
                                </button>
                            </div>

                            {scoreForm.bowlingStats.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {scoreForm.bowlingStats.map((stat, i) => {
                                        const playerName = allPlayers.find(p => p._id === stat.player)?.name || 'Unknown'
                                        return (
                                            <div key={i} className="flex items-center justify-between bg-red-50 px-3 py-1.5 rounded-lg text-xs">
                                                <span className="font-medium">{playerName}</span>
                                                <span>{stat.overs}-{stat.maidens}-{stat.runs}-{stat.wickets}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Player of Match */}
                        <div className="border-t border-gray-100 pt-4 mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">⭐ Player of the Match</p>
                            <select
                                value={scoreForm.playerOfMatch}
                                onChange={(e) => setScoreForm({ ...scoreForm, playerOfMatch: e.target.value })}
                                className="input-field text-sm"
                            >
                                <option value="">Select POTM</option>
                                {allPlayers.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAIPotm}
                                className="text-xs text-purple-600 font-medium mt-2 flex items-center gap-1"
                            >
                                <HiLightningBolt /> AI suggest POTM
                            </button>

                            {potmSuggestion && (
                                <div className="bg-purple-50 rounded-lg p-3 mt-2">
                                    <p className="text-xs font-bold text-purple-700 mb-1">🤖 AI Recommendation:</p>
                                    {potmSuggestion.candidates?.map((c, i) => (
                                        <p key={i} className="text-xs text-purple-600 mb-1">
                                            {i + 1}. <strong>{c.name}</strong> — {c.reason}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmitScorecard}
                            className="btn-primary w-full"
                        >
                            💾 Save Scorecard
                        </button>
                    </div>
                </Motion.div>
            )}
        </div>
    )
}

export default ScorecardPage