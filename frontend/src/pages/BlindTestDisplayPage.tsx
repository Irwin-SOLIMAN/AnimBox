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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state) return
    if (state.previewUrl && state.previewUrl !== lastPreviewUrl.current) {
      audio.src = state.previewUrl
      lastPreviewUrl.current = state.previewUrl
      if (state.playing) audio.play().catch(() => {})
    }
    state.playing ? audio.play().catch(() => {}) : audio.pause()
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
      <p className="animate-pulse text-3xl font-bold text-yellow-400">
        La partie va bientôt commencer...
      </p>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col" style={{ background: BG }}>
      <audio ref={audioRef} />

      {/* Pintes de bière — zone principale */}
      <div className="flex flex-1 items-end justify-center gap-6 px-8 pt-8 pb-4">
        {state.teams.map((team) => {
          const fillPct = state.totalTracks > 0
            ? Math.min((team.score / state.totalTracks) * 100, 100)
            : 0
          const isRaised = team.id === state.raisedTeamId

          return (
            <div key={team.id} className="flex flex-col items-center gap-3" style={{ flex: 1, maxWidth: 140 }}>
              {/* Animation "main levée" */}
              {isRaised && (
                <div className="animate-bounce text-4xl">🙋</div>
              )}
              {!isRaised && <div className="h-10" />}

              {/* Pinte de bière */}
              <BeerGlass fillPct={fillPct} isHighlighted={isRaised} teamId={team.id} />

              {/* Nom de l'équipe */}
              <p className={`text-center text-lg font-black transition-colors
                ${isRaised ? 'text-yellow-400' : 'text-white'}`}>
                {team.name}
              </p>

              {/* Score visible uniquement en fin de partie */}
              {state.status === 'FINISHED' && (
                <p className="text-2xl font-black text-yellow-400">{team.score} pts</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Bande du bas */}
      <div className="border-t border-white/10 bg-black/30 px-8 py-5">
        {state.status === 'WAITING' && (
          <p className="text-center text-2xl font-bold text-white/50">En attente de l'animateur...</p>
        )}

        {state.status === 'IN_PROGRESS' && (
          <div className="flex items-center justify-between">
            {/* Statut lecture */}
            <div className="flex items-center gap-3">
              {state.playing ? (
                <>
                  <MusicBars />
                  <span className="text-lg font-bold text-yellow-400">En cours...</span>
                </>
              ) : (
                <span className="text-lg text-white/30">⏸ En pause</span>
              )}
            </div>

            {/* Piste */}
            {state.trackRevealed && state.currentTrack ? (
              <div className="text-right">
                <p className="text-xl font-black text-white">{state.currentTrack.title}</p>
                <p className="text-base text-white/60">{state.currentTrack.artist}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-right">
                <span className="text-3xl text-white/20">♪</span>
                <div>
                  <p className="text-lg font-bold text-white/20">???</p>
                  <p className="text-sm text-white/20">
                    Piste {state.currentTrackIndex + 1} / {state.totalTracks}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {state.status === 'FINISHED' && (
          <div className="text-center">
            {(() => {
              const sorted = [...state.teams].sort((a, b) => b.score - a.score)
              const winner = sorted[0]
              const tied = sorted.filter(t => t.score === winner.score).length > 1
              return (
                <>
                  <p className="text-4xl font-black text-yellow-400">🏆 Partie terminée !</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {tied ? 'Égalité !' : `${winner.name} gagne !`}
                  </p>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Beer glass SVG ────────────────────────────────────────────────────────────

function BeerGlass({ fillPct, isHighlighted, teamId }: { fillPct: number; isHighlighted: boolean; teamId: number }) {
  const clampedFill = Math.max(0, Math.min(100, fillPct))
  const uid = `t${teamId}`
  const glowStyle = isHighlighted
    ? { filter: 'drop-shadow(0 0 16px rgba(244,185,66,0.7))' }
    : {}

  return (
    <div style={{ ...glowStyle, width: '100%', maxWidth: 90, margin: '0 auto' }}>
      <svg viewBox="0 0 80 140" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
        <defs>
          <clipPath id={`glass-clip-${uid}`}>
            <polygon points="10,10 70,10 65,130 15,130" />
          </clipPath>
          <linearGradient id={`beer-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b8720a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={`foam-grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fefce8" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id={`glass-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>

        {/* Fond verre (vide) */}
        <polygon
          points="10,10 70,10 65,130 15,130"
          fill="rgba(30,20,60,0.8)"
          stroke={isHighlighted ? '#f4b942' : 'rgba(255,255,255,0.2)'}
          strokeWidth="2"
        />

        {/* Remplissage bière */}
        <g clipPath={`url(#glass-clip-${uid})`}>
          <rect
            x="0" y={130 - (clampedFill / 100) * 120} width="80" height={clampedFill / 100 * 120}
            fill={`url(#beer-grad-${uid})`}
            style={{ transition: 'y 1.2s cubic-bezier(0.34,1.56,0.64,1), height 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          {clampedFill > 3 && (
            <rect
              x="0" y={130 - (clampedFill / 100) * 120 - 14} width="80" height="16"
              fill={`url(#foam-grad-${uid})`}
              rx="4"
              style={{ transition: 'y 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          )}
          {clampedFill > 10 && [25, 40, 55].map((x, i) => (
            <circle
              key={i}
              cx={x} cy={130 - (clampedFill / 100) * 60 - i * 15}
              r="2" fill="rgba(255,255,255,0.3)"
            />
          ))}
        </g>

        {/* Reflet verre */}
        <polygon
          points="10,10 70,10 65,130 15,130"
          fill={`url(#glass-grad-${uid})`}
        />
      </svg>
    </div>
  )
}

// ── Music bars animation ──────────────────────────────────────────────────────

function MusicBars() {
  return (
    <div className="flex items-end gap-0.5" style={{ height: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-yellow-400"
          style={{
            height: `${50 + Math.sin(i * 1.5) * 30}%`,
            animation: `pulse ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}
