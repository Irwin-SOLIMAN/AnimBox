import api from './api'

interface AuthResponse {
  accessToken: string
  refreshToken: string
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  register: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password })
    return data
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/refresh', null, {
      headers: { 'Refresh-Token': refreshToken },
    })
    return data
  },
}
