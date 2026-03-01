import api from './api'

const aiService = {
    balanceTeams: (matchId) => api.post('/ai/balance-teams', { matchId }),
    matchSummary: (matchId) => api.post('/ai/match-summary', { matchId }),
    playerInsight: (playerId, groupId) => api.post('/ai/player-insight', { playerId, groupId }),
    potmSuggestion: (matchId) => api.post('/ai/potm-suggestion', { matchId }),
    seasonAnalytics: (groupId) => api.post('/ai/season-analytics', { groupId }),
    smartReminder: (playerId, matchId) => api.post('/ai/smart-reminder', { playerId, matchId })
}

export default aiService