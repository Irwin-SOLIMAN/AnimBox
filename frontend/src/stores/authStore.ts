import { create } from 'zustand'

interface User {
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (user: User, token: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  login: (user, token, refreshToken) => {
    sessionStorage.setItem('access_token', token)
    sessionStorage.setItem('refresh_token', refreshToken)
    set({ user, token, refreshToken, isAuthenticated: true })
  },

  logout: () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },
}))
