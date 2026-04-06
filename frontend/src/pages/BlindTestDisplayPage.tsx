import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { blindTestService } from '../services/blindTestService'
import type { BlindTestStateDTO } from '../types/blindTest'
import useWebSocket from '../hooks/useWebSocket'

const BG = 'radial-gradient(ellipse at 50% 20%, #1a0a3d 0%, #080f22 70%)'

export default function BlindTestDisplayPage() {
  const { id: token } = useParams<{ id: string }>()
  const [state, setState] = useState<BlindTestStateDTO | null>(null)
  const [sessionId, setSessionId] = useState<number>(0)
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPreviewUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!token) return
    blindTestService
      .getStateByToken(token)
      .then((s) => { setSessionId(s.sessionId); setState(s) })
      .catch(() => setError('Session introuvable'))
  }, [token])

  // Sync audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state) return

    if (state.previewUrl && state.previewUrl !== lastPreviewUrl.current) {
      audio.src = state.previewUrl
      lastPreviewUrl.current = state.previewUrl
      if (state.playing) audio.play().catch(() => {})
    }

    if (state.playing) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [state?.playing, state?.previewUrl])

  useWebSocket<BlindTestStateDTO>({
    topic: sessionId ? `/topic/blind-test/${sessionId}` : '',
    onMessage: setState,
    onError: setError,
  })

  if (error) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
      <p className="text-red-400">{error}</p>
    </div>
  )

  if (!state) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
      <p className="animate-pulse text-2xl font-bold text-yellow-400">La partie va bientôt commencer...</p>
    </div>
  )

  const handTeamName =
    state.handState === 'A' ? state.teamAName :
    state.handState === 'B' ? state.teamBName : null

  return (
    <div className="flex min-h-screen flex-col" style={{ background: BG }}>
      <audio ref={audioRef} />

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4 p-6">
        {([['A', state.teamAName, state.teamAScore], ['B', state.teamBName, state.teamBScore]] as const).map(
          ([key, name, score]) => (
            <div
              key={key}
              className={`rounded-3xl border-4 p-6 text-center transition-all duration-500
                ${state.handState === key
                  ? 'border-yellow-400 bg-yellow-400/15 shadow-[0_0_40px_rgba(244,185,66,0.4)]'
                  : 'border-white/10 bg-white/5'
                }`}
            >
              <p className="text-2xl font-bold text-white/80">{name}</p>
              <p className={`text-6xl font-black ${state.handState === key ? 'text-yellow-400' : 'text-white'}`}>
                {score}
              </p>
            </div>
          )
        )}
      </div>

      {/* Zone centrale */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">

        {/* Indicateur main levée */}
        {handTeamName && (
          <div className="mb-8 animate-bounce rounded-2xl border-2 border-yellow-400 bg-yellow-400/10 px-8 py-4">
            <p className="text-3xl font-black text-yellow-400">🙋 {handTeamName} !</p>
          </div>
        )}

        {/* Info piste */}
        {state.status === 'WAITING' && (
          <p className="text-3xl font-bold text-white/50">La partie va bientôt commencer...</p>
        )}

        {state.status === 'IN_PROGRESS' && (
          <div className="w-full max-w-xl">
            {/* Statut lecture */}
            <div className="mb-6 flex items-center justify-center gap-3">
              {state.playing ? (
                <>
                  <MusicBars />
                  <span className="text-lg font-bold text-yellow-400">En cours...</span>
                  <MusicBars />
                </>
              ) : (
                <span className="text-lg text-white/30">⏸ En pause</span>
              )}
            </div>

            {/* Piste révélée ou masquée */}
            {state.trackRevealed && state.currentTrack ? (
              <div className="rounded-3xl border border-yellow-400/30 bg-white/5 p-8">
                <p className="mb-2 text-4xl font-black text-white">{state.currentTrack.title}</p>
                <p className="text-2xl text-white/60">{state.currentTrack.artist}</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-5xl font-black text-white/20">♪ ♪ ♪</p>
                <p className="mt-3 text-lg text-white/30">Quelle est cette chanson ?</p>
              </div>
            )}

            {/* Numéro de piste */}
            <p className="mt-4 text-sm text-white/30">
              Piste {state.currentTrackIndex + 1} / {state.totalTracks}
            </p>
          </div>
        )}

        {state.status === 'FINISHED' && (
          <div className="text-center">
            <p className="mb-4 text-5xl font-black text-yellow-400">🏆</p>
            <p className="text-3xl font-black text-white">
              {state.teamAScore > state.teamBScore
                ? `${state.teamAName} gagne !`
                : state.teamBScore > state.teamAScore
                  ? `${state.teamBName} gagne !`
                  : 'Égalité !'}
            </p>
            <p className="mt-2 text-xl text-white/50">
              {state.teamAScore} — {state.teamBScore}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MusicBars() {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-yellow-400"
          style={{
            height: `${40 + Math.sin(i * 1.5) * 30}%`,
            animation: `pulse ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}
