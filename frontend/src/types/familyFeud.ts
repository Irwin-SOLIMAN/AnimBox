export interface FamilyFeudAnswerResponse {
  id: number
  text: string
  rank: number
  score: number
}

export interface FamilyFeudQuestionResponse {
  id: number
  text: string
  category: string | null
  answers: FamilyFeudAnswerResponse[]
}

export interface FamilyFeudAnswerRequest {
  text: string
  rank: number
  score: number
}

export interface FamilyFeudQuestionRequest {
  text: string
  category: string
  answers: FamilyFeudAnswerRequest[]
}
