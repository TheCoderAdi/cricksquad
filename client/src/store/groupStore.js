import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useGroupStore = create(
    persist(
        (set, get) => ({
            groups: [],
            currentGroup: null,
            isLoading: false,

            // Fetch my groups
            fetchGroups: async () => {
                set({ isLoading: true })
                try {
                    const { data } = await api.get('/groups')
                    set({ groups: data.data, isLoading: false })

                    if (!get().currentGroup && data.data.length > 0) {
                        set({ currentGroup: data.data[0] })
                    }
                } catch {
                    set({ isLoading: false })
                }
            },

            // Set current group
            setCurrentGroup: (group) => {
                set({ currentGroup: group })
            },

            // Create group
            createGroup: async (groupData) => {
                try {
                    const { data } = await api.post('/groups', groupData)
                    set(state => ({
                        groups: [...state.groups, data.data],
                        currentGroup: data.data
                    }))
                    return { success: true, data: data.data }
                } catch (error) {
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Failed to create group'
                    }
                }
            },

            // Join group
            joinGroup: async (code) => {
                try {
                    const { data } = await api.post('/groups/join', { code })
                    set(state => ({
                        groups: [...state.groups, data.data],
                        currentGroup: data.data
                    }))
                    return { success: true, data: data.data }
                } catch (error) {
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Failed to join group'
                    }
                }
            },

            // Get group details
            fetchGroupDetails: async (groupId) => {
                try {
                    const { data } = await api.get(`/groups/${groupId}`)
                    set({ currentGroup: data.data })
                    return { success: true, data: data.data }
                } catch {
                    return { success: false }
                }
            },

            // Update group
            updateGroup: async (groupId, updateData) => {
                try {
                    const { data } = await api.put(`/groups/${groupId}`, updateData)
                    set(state => ({
                        currentGroup: data.data,
                        groups: state.groups.map(g => g._id === groupId ? data.data : g)
                    }))
                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Failed to update group'
                    }
                }
            },

            // Clear
            clearGroups: () => {
                set({ groups: [], currentGroup: null })
            },

            // Helpers to check membership/admin status for current group
            isCurrentUserAdmin: () => {
                const group = get().currentGroup
                if (!group) return false
                try {
                    const stored = localStorage.getItem('cricksquad-auth')
                    if (!stored) return false
                    const { state } = JSON.parse(stored)
                    const userId = state?.user?._id
                    if (!userId) return false
                    return (group.members || []).some(m => {
                        const uid = m.user?._id || m.user
                        return String(uid) === String(userId) && m.role === 'admin'
                    })
                } catch { return false }
            },
            isCurrentUserMember: () => {
                const group = get().currentGroup
                if (!group) return false
                try {
                    const stored = localStorage.getItem('cricksquad-auth')
                    if (!stored) return false
                    const { state } = JSON.parse(stored)
                    const userId = state?.user?._id
                    if (!userId) return false
                    return (group.members || []).some(m => {
                        const uid = m.user?._id || m.user
                        return String(uid) === String(userId)
                    })
                } catch { return false }
            }
        }),
        {
            name: 'cricksquad-group',
            partialize: (state) => ({
                currentGroup: state.currentGroup
            })
        }
    )
)