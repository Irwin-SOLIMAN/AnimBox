export type SessionStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

export type ActionType =
  | 'START'
  | 'NEXT_QUESTION'
  | 'REVEAL_ANSWER'
  | 'ADD_SCORE'
  | 'FINISH'
  | 'FAULT'
  | 'STEAL'
  | 'END_ROUND'

export interface ActionDTO {
  type: ActionType
  answerId?: number
  teamA?: boolean
  points?: number
}

export interface GameStateDTO {
  sessionId: number
  status: SessionStatus
  currentQuestionIndex: number
  totalQuestions: number
  teamAName: string
  teamBName: string
  teamAScore: number
  teamBScore: number
  revealedAnswerIds: number[]
  currentQuestion: {
    id: number
    text: string
    answers: { id: number; text: string; rank: number; score: number }[]
  } | null
  currentFaults: number
  teamAPlaying: boolean
  stealPhase: boolean
  roundPoints: number
}

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
