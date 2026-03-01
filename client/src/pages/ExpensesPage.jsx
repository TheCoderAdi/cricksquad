import { useEffect, useState, startTransition } from 'react'
import { useParams } from 'react-router-dom'
import matchService from '../services/matchService'
import { useGroupStore } from '../store/groupStore'
import userService from '../services/userService'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import { HiCurrencyRupee, HiCheck, HiX, HiBell } from 'react-icons/hi'
import { motion as Motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

const ExpensesPage = () => {
    const { matchId } = useParams()
    const { currentGroup, isCurrentUserAdmin } = useGroupStore()
    const { user } = useAuthStore()
    const [match, setMatch] = useState(null)
    const [balances, setBalances] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSetCost, setShowSetCost] = useState(false)
    const [totalCost, setTotalCost] = useState('')
    const [savingCost, setSavingCost] = useState(false)

    const loadData = async () => {
        try {
            const { data } = await matchService.getById(matchId)
            setMatch(data.data)

            if (currentGroup) {
                const { data: balanceData } = await userService.getBalances(currentGroup._id)
                setBalances(balanceData.data)
            }
        } catch (error) {
            toast.error('Failed to load expenses', error)
        }
        setIsLoading(false)
    }
    useEffect(() => {
        startTransition(() => {
            loadData()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId])


    const handleSetCost = async () => {
        if (!totalCost || isNaN(totalCost)) {
            toast.error('Enter a valid amount')
            return
        }
        setSavingCost(true)
        try {
            await matchService.updateExpenses(matchId, { totalCost: Number(totalCost), groupId: currentGroup._id })
            toast.success('Cost updated!')
            setShowSetCost(false)
            loadData()
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to update cost'}`)
        }
        setSavingCost(false)
    }

    const handleMarkPaid = async (userId) => {
        try {
            await matchService.markAsPaid(matchId, userId, { groupId: currentGroup._id })
            toast.success('Marked as paid!')
            loadData()
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to update payment'}`)
        }
    }

    // Send alert to group members (admin only)
    const handleSendAlertForPlayer = async (player, amount) => {
        if (!currentGroup) return toast.error('No group selected')
        const msg = `Reminder: ${player?.name || 'Member'} owes ₹${amount} for the match.`
        try {
            await api.post(`/groups/${currentGroup._id}/alert`, { amount, message: msg })
            toast.success('Alert sent to group members')
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to send alert'}`)
        }
    }

    // Send a generic reminder to all members about outstanding balance (admin only)
    const handleRemindAll = async () => {
        if (!currentGroup) return toast.error('No group selected')
        const outstanding = payments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0)
        if (outstanding <= 0) return toast('No outstanding amounts to remind')
        const msg = `Reminder: Total outstanding amount for this match is ₹${outstanding}. Please settle your dues.`
        try {
            await api.post(`/groups/${currentGroup._id}/alert`, { amount: outstanding, message: msg })
            toast.success('Reminder sent to all members')
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to send reminder'}`)
        }
    }

    if (isLoading) return <LoadingSpinner message="Loading expenses..." />
    if (!match) return <div className="text-center py-10">Match not found</div>

    const expenses = match.expenses || {}
    const payments = expenses.payments || []
    const paidCount = payments.filter(p => p.paid).length
    const totalPlayers = payments.length
    const collectedAmount = payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0)
    const progressPercent = expenses.totalCost > 0 ? (collectedAmount / expenses.totalCost) * 100 : 0

    return (
        <div className="space-y-5">
            {/* Header */}
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">💰 Match Expenses</h1>
            </Motion.div>

            {/* Cost Summary */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                {expenses.totalCost > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Cost</p>
                                <p className="text-3xl font-bold text-gray-900">₹{expenses.totalCost}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Per Person</p>
                                <p className="text-xl font-bold text-primary-600">₹{expenses.perPersonCost}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Collected: ₹{collectedAmount}</span>
                                <span>₹{expenses.totalCost}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary-500'
                                        }`}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                {paidCount}/{totalPlayers} paid ({Math.round(progressPercent)}%)
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            {
                                isCurrentUserAdmin() && progressPercent < 100 && (
                                    <>
                                        <button
                                            onClick={() => setShowSetCost(true)}
                                            className="ml-3 text-xs text-primary-600 font-medium bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100"
                                        >
                                            Edit amount
                                        </button>
                                        <button
                                            onClick={handleRemindAll}
                                            className="ml-3 text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100"
                                        >
                                            🔔 Remind All
                                        </button>
                                    </>
                                )
                            }
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <HiCurrencyRupee className="text-4xl text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm mb-3">No cost set for this match</p>
                        <button
                            onClick={() => setShowSetCost(true)}
                            className="btn-primary text-sm"
                        >
                            💰 Set Match Cost
                        </button>
                    </div>
                )}
            </Motion.div>

            {/* Payment Status */}
            {payments.length > 0 && (
                <>
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                    >
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <HiCheck className="text-green-500" />
                            Paid ({paidCount})
                        </h3>
                        <div className="space-y-2">
                            {payments.filter(p => p.paid).map((payment, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <span className="text-xs font-bold text-green-700">
                                                {payment.player?.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{
                                            user?._id === payment.player?._id ? 'You' : payment.player?.name
                                        }</p>
                                    </div>
                                    <span className="badge-green text-xs">✅ ₹{payment.amount}</span>
                                </div>
                            ))}
                        </div>
                    </Motion.div>

                    {payments.filter(p => !p.paid).length > 0 && (
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="card"
                        >
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <HiX className="text-red-500" />
                                Unpaid ({payments.filter(p => !p.paid).length})
                            </h3>
                            <div className="space-y-2">
                                {payments.filter(p => !p.paid).map((payment, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-red-700">
                                                    {payment.player?.name?.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user?._id === payment.player?._id ? 'You' : payment.player?.name
                                                }</p>
                                                <p className="text-xs text-red-500">₹{payment.amount}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {
                                                isCurrentUserAdmin() || (payment.player?._id === user?._id) ? (
                                                    <button
                                                        onClick={() => handleMarkPaid(payment.player?._id)}
                                                        className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100"
                                                    >
                                                        ✅ Paid
                                                    </button>
                                                ) : null
                                            }
                                            {isCurrentUserAdmin() && (
                                                <button
                                                    onClick={() => handleSendAlertForPlayer(payment.player, payment.amount)}
                                                    className="text-xs bg-orange-50 text-orange-600 px-2 py-1.5 rounded-lg hover:bg-orange-100"
                                                >
                                                    <HiBell />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Motion.div>
                    )}
                </>
            )}

            {/* Running Balances */}
            {balances.length > 0 && (
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                >
                    <h3 className="font-bold text-gray-900 mb-3">📊 Running Balances</h3>
                    <div className="space-y-2">
                        {balances.filter(b => b.balance > 0).map((balance, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-700">
                                            {balance.player?.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{balance.player?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-red-600">₹{balance.balance}</p>
                                    <p className="text-[10px] text-gray-400">{balance.unpaidMatches} matches</p>
                                </div>
                            </div>
                        ))}
                        {balances.filter(b => b.balance > 0).length === 0 && (
                            <p className="text-sm text-green-600 text-center py-3">✅ Everyone is settled up!</p>
                        )}
                    </div>
                </Motion.div>
            )}

            {/* Set Cost Modal */}
            <Modal isOpen={showSetCost} onClose={() => setShowSetCost(false)} title="💰 Set Match Cost">
                <div className="space-y-4 mb-16">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Ground Cost (₹)
                        </label>
                        <input
                            type="number"
                            value={totalCost}
                            onChange={(e) => setTotalCost(e.target.value)}
                            placeholder="e.g., 3000"
                            className="input-field text-xl text-center"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleSetCost}
                        disabled={savingCost}
                        className="btn-primary w-full"
                    >
                        {savingCost ? 'Saving...' : '💰 Set Cost & Split'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}


export default ExpensesPage