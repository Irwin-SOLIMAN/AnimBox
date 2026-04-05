import api from './api'
import type { GameSessionResponse, GameSessionRequest, GameStateDTO } from '../types/gameSession'

const BASE = '/game-sessions'

export const gameSessionService = {
  create: async (data: GameSessionRequest): Promise<GameSessionResponse> =>
    (await api.post<GameSessionResponse>(BASE, data)).data,

  getById: async (id: number): Promise<GameSessionResponse> =>
    (await api.get<GameSessionResponse>(`${BASE}/${id}`)).data,

  start: async (id: number): Promise<GameSessionResponse> =>
    (await api.post<GameSessionResponse>(`${BASE}/${id}/start`)).data,

  finish: async (id: number): Promise<GameSessionResponse> =>
    (await api.post<GameSessionResponse>(`${BASE}/${id}/finish`)).data,

  getState: async (id: number): Promise<GameStateDTO> =>
    (await api.get<GameStateDTO>(`${BASE}/${id}/state`)).data,

  getStateByToken: async (token: string): Promise<GameStateDTO> =>
    (await api.get<GameStateDTO>(`${BASE}/by-token/${token}/state`)).data,
}
