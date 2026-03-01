import api from './api'

const groupService = {
    getMyGroups: () => api.get('/groups'),
    getById: (groupId) => api.get(`/groups/${groupId}`),
    create: (data) => api.post('/groups', data),
    join: (code) => api.post('/groups/join', { code }),
    update: (groupId, data) => api.put(`/groups/${groupId}`, data),
    removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`)
}

export default groupService