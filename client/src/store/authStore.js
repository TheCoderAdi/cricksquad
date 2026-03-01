import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            // Register
            register: async (userData) => {
                set({ isLoading: true })
                try {
                    const { data } = await api.post('/auth/register', userData)

                    if (data.token) {
                        set({
                            user: data.data,
                            token: data.token,
                            isAuthenticated: true,
                            isLoading: false
                        })
                        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
                        return { success: true }
                    }

                    set({ isLoading: false })
                    return { success: true, requiresVerification: true, message: data.message }
                } catch (error) {
                    set({ isLoading: false })
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Registration failed'
                    }
                }
            },

            // Login
            login: async (credentials) => {
                set({ isLoading: true })
                try {
                    const { data } = await api.post('/auth/login', credentials)
                    set({
                        user: data.data,
                        token: data.token,
                        isAuthenticated: true,
                        isLoading: false
                    })
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
                    return { success: true }
                } catch (error) {
                    set({ isLoading: false })
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Login failed'
                    }
                }
            },

            // Logout
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false })
                delete api.defaults.headers.common['Authorization']
            },

            // Refresh user data
            refreshUser: async () => {
                try {
                    const { data } = await api.get('/auth/me')
                    set({ user: data.data })
                } catch (error) {
                    if (error.response?.status === 401) {
                        get().logout()
                    }
                }
            },

            // Update profile
            updateProfile: async (profileData) => {
                try {
                    const { data } = await api.put('/auth/profile', profileData)
                    set({ user: data.data })
                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Update failed'
                    }
                }
            }
        }),
        {
            name: 'cricksquad-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
)