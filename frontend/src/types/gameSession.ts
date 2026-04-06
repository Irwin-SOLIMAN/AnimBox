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
  | 'SET_TEAM'
  | 'SET_MULTIPLIER'

export interface ActionDTO {
  type: ActionType
  answerId?: number
  teamA?: boolean
  points?: number
}

export interface GameStateDTO {
  sessionId: number
  token: string
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
  roundMultiplier: number
}

export interface GameSessionResponse {
  id: number
  token: string
  gameSet: { id: number; name: string }
  status: SessionStatus
  teamAName: string
  teamBName: string
  teamAScore: number
  teamBScore: number
  currentQuestionIndex: number
  revealedAnswerIds: number[]
  createdAt: string
}

export interface GameSessionRequest {
  gameSetId: number
  teamAName: string
  teamBName: string
}
