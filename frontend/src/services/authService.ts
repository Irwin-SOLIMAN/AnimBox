import api from './api'

interface AuthResponse {
  accessToken: string
  refreshToken: string
}

interface MessageResponse {
  message: string
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  register: async (email: string, password: string): Promise<MessageResponse> => {
    const { data } = await api.post<MessageResponse>('/auth/register', { email, password })
    return data
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/refresh', null, {
      headers: { 'Refresh-Token': refreshToken },
    })
    return data
  },

  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const { data } = await api.get<AuthResponse>(`/auth/verify-email?token=${token}`)
    return data
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const { data } = await api.post<MessageResponse>('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (token: string, newPassword: string): Promise<MessageResponse> => {
    const { data } = await api.post<MessageResponse>('/auth/reset-password', { token, newPassword })
    return data
  },
}
