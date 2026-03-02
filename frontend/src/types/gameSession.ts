export type SessionStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

export interface GameSessionResponse {
  id: number
  status: SessionStatus
  teamAName: string
  teamBName: string
  teamAScore: number
  teamBScore: number
  currentQuestionIndex: number
  revealedAnswerIds: number[]
}

export interface GameSessionRequest {
  gameSetId: number
  teamAName: string
  teamBName: string
}
