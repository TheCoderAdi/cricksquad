import api from './api'

const matchService = {
    // Create match
    create: (matchData) => api.post('/matches', matchData),

    // Get match by ID
    getById: (matchId) => api.get(`/matches/${matchId}`),

    // Get group matches
    getGroupMatches: (groupId, params) => api.get(`/matches/group/${groupId}`, { params }),

    // Get upcoming match
    getUpcoming: (groupId) => api.get(`/matches/group/${groupId}/upcoming`),

    // RSVP
    submitRSVP: (matchId, status) => api.post(`/matches/${matchId}/rsvp`, { status }),

    // Teams
    generateTeams: (matchId, data) => api.post(`/matches/${matchId}/teams/generate`, data),
    performToss: (matchId, data) => api.post(`/matches/${matchId}/toss`, data),

    // Expenses
    updateExpenses: (matchId, data) => api.put(`/matches/${matchId}/expenses`, data),
    markAsPaid: (matchId, userId, data) => api.put(`/matches/${matchId}/expenses/${userId}/pay`, data),

    // Scorecard
    submitScorecard: (matchId, data) => api.post(`/matches/${matchId}/scorecard`, data),

    // Gallery
    uploadPhotos: (matchId, formData) => api.post(`/matches/${matchId}/gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deletePhoto: (matchId, photoId) => api.delete(`/matches/${matchId}/gallery/${photoId}`),

    // Status
    updateStatus: (matchId, status) => api.put(`/matches/${matchId}/status`, { status })
}

export default matchService