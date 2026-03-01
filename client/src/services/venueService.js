import api from './api'

const venueService = {
    create: (data) => api.post('/venues', data),
    getByGroup: (groupId) => api.get(`/venues/group/${groupId}`),
    getById: (venueId) => api.get(`/venues/${venueId}`),
    update: (venueId, data) => api.put(`/venues/${venueId}`, data),
    delete: (venueId) => api.delete(`/venues/${venueId}`)
}

export default venueService