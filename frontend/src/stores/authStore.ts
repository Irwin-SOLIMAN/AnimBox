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
  setTokens: (token: string, refreshToken: string) => void
}

const storedToken = sessionStorage.getItem('access_token')
const storedRefreshToken = sessionStorage.getItem('refresh_token')

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: storedToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedToken,

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

  setTokens: (token, refreshToken) => {
    sessionStorage.setItem('access_token', token)
    sessionStorage.setItem('refresh_token', refreshToken)
    set({ token, refreshToken })
  },
}))
