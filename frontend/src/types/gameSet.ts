import type { FamilyFeudQuestionResponse } from './familyFeud'

export interface GameSetResponse {
  id: number
  name: string
  gameType: { id: number; code: string; name: string; description: string | null; maxPlayers: number }
  questions: FamilyFeudQuestionResponse[]
  createdAt: string
}

export interface GameSetRequest {
  name: string
  gameTypeId: number
  questionIds: number[]
}
