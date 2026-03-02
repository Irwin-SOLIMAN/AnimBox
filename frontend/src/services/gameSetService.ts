import api from './api'
import type { GameSetResponse, GameSetRequest } from '../types/gameSet'

const BASE = '/game-sets'

export const gameSetService = {
  findAll: async (): Promise<GameSetResponse[]> =>
    (await api.get<GameSetResponse[]>(BASE)).data,

  create: async (data: GameSetRequest): Promise<GameSetResponse> =>
    (await api.post<GameSetResponse>(BASE, data)).data,

  update: async (id: number, data: GameSetRequest): Promise<GameSetResponse> =>
    (await api.put<GameSetResponse>(`${BASE}/${id}`, data)).data,

  delete: async (id: number): Promise<void> =>
    api.delete(`${BASE}/${id}`),
}
