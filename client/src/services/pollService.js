import api from './api'

const pollService = {
    create: (data) => api.post('/polls', data),
    getByGroup: (groupId, params) => api.get(`/polls/group/${groupId}`, { params }),
    vote: (pollId, optionIndex) => api.post(`/polls/${pollId}/vote`, { optionIndex }),
    close: (pollId) => api.put(`/polls/${pollId}/close`),
    delete: (pollId) => api.delete(`/polls/${pollId}`)
}

export default pollService