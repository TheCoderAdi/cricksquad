import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json'
    }
})

api.interceptors.request.use(
    (config) => {
        const stored = localStorage.getItem('cricksquad-auth')
        if (stored) {
            const { state } = JSON.parse(stored)
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`
            }
        }
        return config
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('cricksquad-auth')
            localStorage.removeItem('cricksquad-group')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api