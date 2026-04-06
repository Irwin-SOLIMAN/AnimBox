export type SessionStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

export interface BlindTestTeamDTO {
  id: number
  name: string
  score: number
  position: number
}

export interface BlindTestTrackDTO {
  id: number
  title: string
  artist: string
  deezerTrackId: number | null
  pointsValue: number
}

export interface BlindTestStateDTO {
  sessionId: number
  token: string
  status: SessionStatus
  currentTrackIndex: number
  totalTracks: number
  playing: boolean
  raisedTeamId: number | null
  trackRevealed: boolean
  teams: BlindTestTeamDTO[]
  currentTrack: BlindTestTrackDTO | null
  previewUrl: string | null
}

export interface BlindTestSetResponse {
  id: number
  name: string
  createdAt: string
  isPublic: boolean
}

export interface BlindTestSessionDTO {
  id: number
  token: string
  status: SessionStatus
  gameSetName: string
  teams: BlindTestTeamDTO[]
  createdAt: string
}

export interface DeezerSearchResult {
  id: number
  title: string
  artist: string
  previewUrl: string
}

export interface BlindTestTrackRequest {
  title: string
  artist: string
  deezerTrackId: number | null
  pointsValue: number
}

export interface BlindTestAction {
  type:
    | 'START' | 'FINISH'
    | 'PLAY' | 'PAUSE'
    | 'NEXT_TRACK'
    | 'RAISE_HAND' | 'LOWER_HAND'
    | 'AWARD_CORRECT' | 'AWARD_WRONG'
    | 'ADJUST_SCORE'
  teamId?: number
  points?: number
}
