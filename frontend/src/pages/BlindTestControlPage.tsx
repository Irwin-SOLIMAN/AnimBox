import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { blindTestService } from '../services/blindTestService'
import type { BlindTestStateDTO, BlindTestAction } from '../types/blindTest'
import useWebSocket from '../hooks/useWebSocket'

type ControlStatus = 'pending' | 'claimed' | 'taken'

const BG = 'radial-gradient(ellipse at 50% 20%, #1a0a3d 0%, #080f22 70%)'
const GOLD = '#f4b942'

export default function BlindTestControlPage() {
  const { id: token } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<BlindTestStateDTO | null>(null)
  const [sessionId, setSessionId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [controlStatus, setControlStatus] = useState<ControlStatus>('pending')

  const clientId = useRef(crypto.randomUUID())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPreviewUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!token) return
    blindTestService
      .getStateByToken(token)
      .then((s) => { setSessionId(s.sessionId); setState(s) })
      .catch(() => setError('Session introuvable'))
      .finally(() => setLoading(false))
  }, [token])

  // Sync audio with state
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
      <p className="animate-pulse text-xl font-bold" style={{ color: GOLD }}>Chargement...</p>
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
      <p className="text-xl font-black" style={{ color: GOLD }}>Session déjà contrôlée</p>
      <p className="text-sm text-white/50">Un autre appareil contrôle déjà cette session.</p>
    </div>
  )

  const { currentTrack } = state
  const handTeamName = state.handState === 'A' ? state.teamAName : state.handState === 'B' ? state.teamBName : null

  return (
    <div className="min-h-screen p-4 pb-10" style={{ background: BG }}>
      <audio ref={audioRef} onEnded={() => dispatch({ type: 'PAUSE' })} />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/games')} className="text-sm text-white/50 hover:text-white">← Quitter</button>
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: GOLD }}>🎵 Blind Test</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-yellow-400' : 'bg-red-400'}`}
          title={isConnected ? 'Connecté' : 'Déconnecté'}
        />
      </div>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {([['A', state.teamAName, state.teamAScore], ['B', state.teamBName, state.teamBScore]] as const).map(
          ([key, name, score]) => (
            <div
              key={key}
              className={`rounded-2xl border-2 p-4 text-center transition-all
                ${state.handState === key ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}
            >
              <p className="truncate font-bold text-white">{name}</p>
              <p className={`text-3xl font-extrabold ${state.handState === key ? 'text-yellow-400' : 'text-white/70'}`}>
                {score}
              </p>
            </div>
          )
        )}
      </div>

      {/* Piste courante (admin voit tout) */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/30">
          Piste {state.currentTrackIndex + 1} / {state.totalTracks}
        </p>
        {currentTrack ? (
          <>
            <p className="text-xl font-black text-white">{currentTrack.title}</p>
            <p className="text-base text-white/60">{currentTrack.artist}</p>
            <p className="mt-1 text-sm text-yellow-400/70">{currentTrack.pointsValue} pt{currentTrack.pointsValue > 1 ? 's' : ''}</p>
          </>
        ) : (
          <p className="text-white/30">Aucune piste</p>
        )}
      </div>

      {/* Contrôles audio */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => dispatch({ type: state.playing ? 'PAUSE' : 'PLAY' })}
            disabled={!state.previewUrl}
            className="flex-1 rounded-2xl py-4 text-2xl font-black text-[#0a1628] transition active:scale-95 disabled:opacity-40"
            style={{ background: `linear-gradient(180deg, #fdd876 0%, ${GOLD} 50%, #c4922e 100%)` }}
          >
            {state.playing ? '⏸' : '▶'}
          </button>
          {state.currentTrackIndex < state.totalTracks - 1 && (
            <button
              onClick={() => dispatch({ type: 'NEXT_TRACK' })}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              ⏭
            </button>
          )}
        </div>
      )}

      {/* Levée de main */}
      {state.status === 'IN_PROGRESS' && state.handState === 'NONE' && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => dispatch({ type: 'RAISE_HAND', teamA: true })}
            className="rounded-2xl border border-white/20 bg-white/5 py-4 font-bold text-white hover:bg-white/10"
          >
            🙋 {state.teamAName}
          </button>
          <button
            onClick={() => dispatch({ type: 'RAISE_HAND', teamA: false })}
            className="rounded-2xl border border-white/20 bg-white/5 py-4 font-bold text-white hover:bg-white/10"
          >
            🙋 {state.teamBName}
          </button>
        </div>
      )}

      {/* Bonne/Mauvaise réponse */}
      {state.status === 'IN_PROGRESS' && state.handState !== 'NONE' && (
        <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4">
          <p className="mb-3 text-center text-base font-bold text-yellow-300">
            🙋 {handTeamName} a levé la main !
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch({ type: 'AWARD_CORRECT' })}
              className="rounded-2xl bg-green-600/80 py-4 text-xl font-black text-white hover:bg-green-500 active:scale-95"
            >
              ✓
            </button>
            <button
              onClick={() => dispatch({ type: 'AWARD_WRONG' })}
              className="rounded-2xl bg-red-700/80 py-4 text-xl font-black text-white hover:bg-red-600 active:scale-95"
            >
              ✗
            </button>
          </div>
        </div>
      )}

      {/* Actions de session */}
      <div className="flex flex-col gap-3">
        {state.status === 'WAITING' && (
          <GoldButton onClick={() => dispatch({ type: 'START' })}>
            Démarrer la partie
          </GoldButton>
        )}

        {state.status === 'IN_PROGRESS' && state.currentTrackIndex >= state.totalTracks - 1 && (
          <button
            onClick={() => dispatch({ type: 'FINISH' })}
            className="w-full rounded-2xl border border-red-500/40 bg-transparent py-3 font-bold text-red-400 hover:bg-red-900/20"
          >
            Terminer la partie
          </button>
        )}

        {state.status === 'FINISHED' && (
          <div className="rounded-2xl border border-yellow-400/30 bg-white/5 p-6 text-center">
            <p className="mb-1 text-2xl font-black text-yellow-400">🏆 Partie terminée !</p>
            <p className="mb-5 text-sm text-white/50">
              {state.teamAScore > state.teamBScore
                ? `${state.teamAName} gagne !`
                : state.teamBScore > state.teamAScore
                  ? `${state.teamBName} gagne !`
                  : 'Égalité !'}
            </p>
            <GoldButton onClick={() => navigate('/games')}>Retour à l'accueil</GoldButton>
          </div>
        )}
      </div>
    </div>
  )
}

function GoldButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl py-4 text-base font-black uppercase tracking-wide text-[#0a1628] transition active:scale-95"
      style={{ background: 'linear-gradient(180deg, #fdd876 0%, #f4b942 50%, #c4922e 100%)' }}
    >
      {children}
    </button>
  )
}
