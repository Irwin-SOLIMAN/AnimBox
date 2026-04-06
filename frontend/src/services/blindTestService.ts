import api from './api'
import type {
  BlindTestSetResponse,
  BlindTestTrackDTO,
  BlindTestTrackRequest,
  BlindTestStateDTO,
  DeezerSearchResult,
} from '../types/blindTest'

const BASE = '/blind-test'

export const blindTestService = {
  // Sets
  getSets: async (): Promise<BlindTestSetResponse[]> =>
    (await api.get<BlindTestSetResponse[]>(`${BASE}/sets`)).data,

  createSet: async (name: string): Promise<BlindTestSetResponse> =>
    (await api.post<BlindTestSetResponse>(`${BASE}/sets`, { name })).data,

  deleteSet: async (setId: number): Promise<void> => {
    await api.delete(`${BASE}/sets/${setId}`)
  },

  // Tracks
  getTracks: async (setId: number): Promise<BlindTestTrackDTO[]> =>
    (await api.get<BlindTestTrackDTO[]>(`${BASE}/sets/${setId}/tracks`)).data,

  addTrack: async (setId: number, data: BlindTestTrackRequest): Promise<BlindTestTrackDTO> =>
    (await api.post<BlindTestTrackDTO>(`${BASE}/sets/${setId}/tracks`, data)).data,

  deleteTrack: async (trackId: number): Promise<void> => {
    await api.delete(`${BASE}/tracks/${trackId}`)
  },

  // Deezer
  searchDeezer: async (q: string): Promise<DeezerSearchResult[]> =>
    (await api.get<DeezerSearchResult[]>(`${BASE}/deezer/search`, { params: { q } })).data,

  // État public (sans auth)
  getStateByToken: async (token: string): Promise<BlindTestStateDTO> =>
    (await api.get<BlindTestStateDTO>(`${BASE}/state/by-token/${token}`)).data,
}
