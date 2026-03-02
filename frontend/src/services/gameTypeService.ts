import api from './api'
import type { GameType } from '../types/gameType'

export const gameTypeService = {
  findAll: async (): Promise<GameType[]> =>
    (await api.get<GameType[]>('/game-types')).data,
}
