import api from './api'

const userService = {
    getStats: (userId) => api.get(`/users/${userId}/stats`),
    getLeaderboard: (groupId, params) => api.get(`/users/leaderboard/${groupId}`, { params }),
    getBalances: (groupId) => api.get(`/users/balances/${groupId}`),
    updateSkills: (userId, data) => api.put(`/users/${userId}/skills`, data)
}

export default userService