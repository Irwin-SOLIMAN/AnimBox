import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { blindTestService } from '../services/blindTestService'
import type { BlindTestStateDTO, BlindTestAction, BlindTestTeamDTO } from '../types/blindTest'
import useWebSocket from '../hooks/useWebSocket'

type ControlStatus = 'pending' | 'claimed' | 'taken'

const BG = 'radial-gradient(ellipse at 50% 20%, #1a0a3d 0%, #080f22 70%)'

export default function BlindTestControlPage() {
  const { id: token } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<BlindTestStateDTO | null>(null)
  const [sessionId, setSessionId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [controlStatus, setControlStatus] = useState<ControlStatus>('pending')
  const [showQR, setShowQR] = useState(false)

  const clientId = useRef(crypto.randomUUID())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPreviewUrl = useRef<string | null>(null)

  const controlUrl = token ? `${window.location.origin}/blind-test/${token}/control` : ''
  const displayUrl = token ? `${window.location.origin}/blind-test/${token}/display` : ''

  useEffect(() => {
    if (!token) return
    blindTestService
      .getStateByToken(token)
      .then((s) => { setSessionId(s.sessionId); setState(s) })
      .catch(() => setError('Session introuvable'))
      .finally(() => setLoading(false))
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
    state.playing ? audio.play().catch(() => {}) : audio.pause()
  }, [state?.playing, state?.previewUrl])

  const { send, isConnected } = useWebSocket<BlindTestStateDTO>({
    topic: sessionId ? `/topic/blind-test/${sessionId}` : '',
    onMessage: setState,
    onError: (msg) => setError(msg),
    onConnect: (client) => {
      client.subscribe(`/topic/blind-test/${sessionId}/control-status`, (msg) => {
        const s = JSON.parse(msg.body) as { type: string; clientId: string }
        if (s.clientId === clientId.current) {
          setControlStatus(s.type === 'CONTROL_CLAIMED' ? 'claimed' : 'taken')
        }
      })
      client.publish({
        destination: `/app/blind-test/${sessionId}/claim-control`,
        body: JSON.stringify({ clientId: clientId.current }),
      })
    },
  })

  const isCommander = controlStatus === 'claimed'
  const dispatch = (action: BlindTestAction) => {
    if (!isCommander) return
    send(`/app/blind-test/${sessionId}/action`, action)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
      <p className="animate-pulse text-xl font-bold text-yellow-400">Chargement...</p>
    </div>
  )

  if (error || !state) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
      <p className="text-red-400">{error || 'Session introuvable'}</p>
    </div>
  )

  if (controlStatus === 'taken') return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: BG }}>
      <p className="text-5xl">🚫</p>
      <p className="text-xl font-black text-yellow-400">Session déjà contrôlée</p>
      <p className="text-sm text-white/50">Un autre appareil contrôle déjà cette session.</p>
    </div>
  )

  const cols = state.teams.length <= 3 ? `grid-cols-${state.teams.length}` : 'grid-cols-3'

  return (
    <div className="min-h-screen p-4 pb-12" style={{ background: BG }}>
      <audio ref={audioRef} onEnded={() => dispatch({ type: 'PAUSE' })} />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/games')} className="text-sm text-white/40 hover:text-white">← Quitter</button>
        <p className="text-sm font-black uppercase tracking-wider text-yellow-400">🎵 Blind Test</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs font-bold text-white/60 hover:bg-white/10"
          >
            QR
          </button>
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-yellow-400' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* QR panel */}
      {showQR && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">Scanner pour contrôler</p>
          <div className="inline-block rounded-xl bg-white p-3">
            <QRCodeSVG value={controlUrl} size={160} />
          </div>
          <p className="mt-2 text-xs text-white/30 break-all">{controlUrl}</p>
          <div className="mt-3 flex gap-2 justify-center">
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              📺 Ouvrir l'affichage TV
            </a>
          </div>
        </div>
      )}

      {/* Piste courante */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/30">
          Piste {state.currentTrackIndex + 1} / {state.totalTracks}
        </p>
        {state.currentTrack ? (
          <>
            <p className="text-base font-black text-white">{state.currentTrack.title}</p>
            <p className="text-sm text-white/50">{state.currentTrack.artist}</p>
          </>
        ) : (
          <p className="text-white/30">Aucune piste</p>
        )}
      </div>

      {/* Contrôles audio */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-4 flex gap-3">
          <GoldButton
            disabled={!state.previewUrl}
            onClick={() => dispatch({ type: state.playing ? 'PAUSE' : 'PLAY' })}
            className="flex-1 text-2xl"
          >
            {state.playing ? '⏸' : '▶'}
          </GoldButton>
          {state.currentTrackIndex < state.totalTracks - 1 && (
            <button
              onClick={() => dispatch({ type: 'NEXT_TRACK' })}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 font-bold text-white hover:bg-white/10"
            >
              ⏭
            </button>
          )}
        </div>
      )}

      {/* Scores + boutons +/- */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/30">Scores</p>
          <div className={`grid gap-2 ${cols}`}>
            {state.teams.map((team) => (
              <TeamScoreCard
                key={team.id}
                team={team}
                onAdjust={(delta) => dispatch({ type: 'ADJUST_SCORE', teamId: team.id, points: delta })}
                disabled={!isCommander}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions de session */}
      {state.status === 'WAITING' && (
        <>
          {/* QR code prominent au démarrage */}
          {!showQR && (
            <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
              <p className="mb-3 text-sm font-bold text-yellow-300">Scanner pour contrôler depuis un téléphone</p>
              <div className="inline-block rounded-xl bg-white p-3">
                <QRCodeSVG value={controlUrl} size={140} />
              </div>
            </div>
          )}
          <GoldButton onClick={() => dispatch({ type: 'START' })}>
            Démarrer la partie
          </GoldButton>
        </>
      )}

      {state.status === 'IN_PROGRESS' && state.currentTrackIndex >= state.totalTracks - 1 && (
        <button
          onClick={() => dispatch({ type: 'FINISH' })}
          className="mt-3 w-full rounded-2xl border border-red-500/40 bg-transparent py-3 font-bold text-red-400 hover:bg-red-900/20"
        >
          Terminer la partie
        </button>
      )}

      {state.status === 'FINISHED' && (
        <div className="rounded-2xl border border-yellow-400/30 bg-white/5 p-6 text-center">
          <p className="mb-2 text-2xl font-black text-yellow-400">🏆 Partie terminée !</p>
          {(() => {
            const winner = [...state.teams].sort((a, b) => b.score - a.score)[0]
            const tied = state.teams.filter(t => t.score === winner.score).length > 1
            return (
              <>
                <p className="mb-1 text-sm text-white/60">{tied ? 'Égalité !' : `${winner.name} gagne !`}</p>
                <div className="mb-5 flex flex-col gap-1">
                  {[...state.teams].sort((a, b) => b.score - a.score).map((t, i) => (
                    <p key={t.id} className={`text-sm ${i === 0 && !tied ? 'font-bold text-yellow-300' : 'text-white/50'}`}>
                      {i + 1}. {t.name} — {t.score} pts
                    </p>
                  ))}
                </div>
              </>
            )
          })()}
          <GoldButton onClick={() => navigate('/games/blind-test/game-sets')}>
            Retour aux playlists
          </GoldButton>
        </div>
      )}
    </div>
  )
}

function TeamScoreCard({
  team,
  onAdjust,
  disabled,
}: {
  team: BlindTestTeamDTO
  onAdjust: (delta: number) => void
  disabled: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
      <p className="mb-1 truncate text-xs font-semibold text-white">{team.name}</p>
      <p className="mb-2 text-2xl font-black text-yellow-400">{team.score}</p>
      <div className="flex gap-1">
        <button
          onClick={() => onAdjust(-1)}
          disabled={disabled || team.score <= 0}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-sm font-bold text-white/60 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-30 transition"
        >
          −
        </button>
        <button
          onClick={() => onAdjust(1)}
          disabled={disabled}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-sm font-bold text-white/60 hover:bg-green-900/30 hover:text-green-300 disabled:opacity-30 transition"
        >
          +
        </button>
      </div>
      <div className="mt-1 flex gap-1">
        <button
          onClick={() => onAdjust(-2)}
          disabled={disabled || team.score < 2}
          className="flex-1 rounded-lg py-1 text-xs text-white/30 hover:text-red-300 disabled:opacity-20 transition"
        >
          −2
        </button>
        <button
          onClick={() => onAdjust(2)}
          disabled={disabled}
          className="flex-1 rounded-lg py-1 text-xs text-white/30 hover:text-green-300 disabled:opacity-20 transition"
        >
          +2
        </button>
      </div>
    </div>
  )
}

function GoldButton({ onClick, children, disabled, className = '' }:
  { onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl py-4 font-black uppercase tracking-wide text-[#0a1628] transition active:scale-95 disabled:opacity-40 ${className}`}
      style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
    >
      {children}
    </button>
  )
}
