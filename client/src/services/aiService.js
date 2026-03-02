import api from './api'

const aiService = {
    balanceTeams: (matchId, opts = {}) => api.post('/ai/balance-teams', { matchId, ...opts }),
    matchSummary: (matchId, opts = {}) => api.post('/ai/match-summary', { matchId, ...opts }),
    playerInsight: (playerId, groupId, opts = {}) => api.post('/ai/player-insight', { playerId, groupId, ...opts }),
    potmSuggestion: (matchId, opts = {}) => api.post('/ai/potm-suggestion', { matchId, ...opts }),
    seasonAnalytics: (groupId, opts = {}) => api.post('/ai/season-analytics', { groupId, ...opts }),
    smartReminder: (playerId, matchId, opts = {}) => api.post('/ai/smart-reminder', { playerId, matchId, ...opts })
}

export default aiService