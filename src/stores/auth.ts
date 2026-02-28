import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('admin_token'))
    const user = ref<any>(null)

    const isAuthenticated = computed(() => !!token.value)

    async function login(username: string, password: string) {
        try {
            const response = await api.post('/auth/login', { username, password })
            token.value = response.data.token
            user.value = response.data.user

            // We explicitly expect admin or root level privileges here
            if (user.value.role !== 'SUPERADMIN' && user.value.role !== 'admin' && user.value.role !== 'ADMIN') {
                throw new Error('Unauthorized role')
            }

            localStorage.setItem('admin_token', token.value!)
            return true
        } catch (error) {
            console.error('Login failed', error)
            logout()
            throw error
        }
    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('admin_token')
    }

    async function fetchUser() {
        if (!token.value) return false
        try {
            const response = await api.get('/auth/me')
            user.value = response.data
            return true
        } catch (error) {
            logout()
            return false
        }
    }

    return { token, user, isAuthenticated, login, logout, fetchUser }
})
