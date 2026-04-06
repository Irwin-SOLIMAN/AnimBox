export type HandState = 'NONE' | 'A' | 'B'
export type SessionStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

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
  handState: HandState
  trackRevealed: boolean
  teamAName: string
  teamBName: string
  teamAScore: number
  teamBScore: number
  currentTrack: BlindTestTrackDTO | null
  previewUrl: string | null
}

export interface BlindTestSetResponse {
  id: number
  name: string
  createdAt: string
  isPublic: boolean
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
  teamA?: boolean
}
