import { create } from 'zustand'
import api from '../api/client'

interface AuthState {
  token: string | null
  username: string | null
  forceChange: boolean
  setToken: (token: string, forceChange: boolean) => void
  logout: () => void
  login: (username: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  forceChange: localStorage.getItem('forceChange') === 'true',

  setToken: (token, forceChange) => {
    localStorage.setItem('token', token)
    localStorage.setItem('forceChange', String(forceChange))
    set({ token, forceChange })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('forceChange')
    set({ token: null, username: null, forceChange: false })
  },

  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    localStorage.setItem('username', username)
    set({
      token: res.data.token,
      username,
      forceChange: res.data.forceChange,
    })
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.post('/auth/change-password', { currentPassword, newPassword })
    localStorage.setItem('forceChange', 'false')
    set({ forceChange: false })
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ username: res.data.username, forceChange: res.data.forceChange })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      set({ token: null, username: null, forceChange: false })
    }
  },
}))
