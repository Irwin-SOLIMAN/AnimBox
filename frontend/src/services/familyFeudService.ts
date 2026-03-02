import api from './api'
import type { FamilyFeudQuestionResponse, FamilyFeudQuestionRequest } from '../types/familyFeud'

const BASE = '/family-feud/questions'

export const familyFeudService = {
  findAll: async (): Promise<FamilyFeudQuestionResponse[]> =>
    (await api.get<FamilyFeudQuestionResponse[]>(BASE)).data,

  create: async (data: FamilyFeudQuestionRequest): Promise<FamilyFeudQuestionResponse> =>
    (await api.post<FamilyFeudQuestionResponse>(BASE, data)).data,

  update: async (id: number, data: FamilyFeudQuestionRequest): Promise<FamilyFeudQuestionResponse> =>
    (await api.put<FamilyFeudQuestionResponse>(`${BASE}/${id}`, data)).data,

  delete: async (id: number): Promise<void> =>
    api.delete(`${BASE}/${id}`),
}
