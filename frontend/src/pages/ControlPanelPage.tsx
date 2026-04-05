import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameSessionService } from '../services/gameSessionService'
import type { GameStateDTO, ActionDTO } from '../types/gameSession'
import useWebSocket from '../hooks/useWebSocket'

type ControlStatus = 'pending' | 'claimed' | 'taken'

const FF_BG = 'radial-gradient(ellipse at 50% 20%, #1a3570 0%, #080f22 70%)'

const ControlPanelPage = () => {
  const { id: token } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<GameStateDTO | null>(null)
  const [sessionId, setSessionId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [controlStatus, setControlStatus] = useState<ControlStatus>('pending')

  useEffect(() => {
    if (!token) return
    gameSessionService
      .getStateByToken(token)
      .then((s) => {
        setSessionId(s.sessionId)
        setState(s)
      })
      .catch(() => setError('Session introuvable'))
      .finally(() => setLoading(false))
  }, [token])

  const { send, isConnected } = useWebSocket<GameStateDTO>({
    topic: sessionId ? `/topic/session/${sessionId}` : '',
    onMessage: setState,
    onError: (msg) => setError(msg),
    onConnect: (client) => {
      const stompSessionId = client.connectedHeaders?.session ?? ''
      client.subscribe(`/topic/control-status/${stompSessionId}`, (message) => {
        const status = JSON.parse(message.body) as { type: string }
        setControlStatus(status.type === 'CONTROL_CLAIMED' ? 'claimed' : 'taken')
      })
      client.publish({
        destination: `/app/session/${sessionId}/claim-control`,
        body: JSON.stringify({}),
      })
    },
  })

  const isCommander = controlStatus === 'claimed'

  const dispatch = (action: ActionDTO) => {
    if (!isCommander) return
    send(`/app/session/${sessionId}/action`, action)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: FF_BG }}>
      <p className="text-xl font-bold text-ff-gold animate-pulse">Chargement...</p>
    </div>
  )

  if (error || !state) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: FF_BG }}>
      <p className="text-red-400">{error || 'Session introuvable'}</p>
    </div>
  )

  if (controlStatus === 'taken') return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: FF_BG }}>
      <p className="text-5xl">🚫</p>
      <p className="text-xl font-black text-ff-gold">Session déjà contrôlée</p>
      <p className="text-sm text-white/50">Un autre appareil est déjà le commandant de bord de cette session.</p>
    </div>
  )

  const { currentQuestion, revealedAnswerIds } = state

  return (
    <div className="min-h-screen p-4 pb-8" style={{ background: FF_BG }}>

      {/* Mini titre */}
      <div className="mb-3 text-center">
        <p
          className="text-lg font-black uppercase tracking-wider text-ff-gold"
          style={{ textShadow: '0 0 12px rgba(244,185,66,0.4)' }}
        >
          Famille en Or
        </p>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/games')}
          className="text-sm text-white/50 hover:text-white"
        >
          ← Quitter
        </button>
        <span className="text-sm font-medium text-white/60">
          Question {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors ${isConnected ? 'bg-ff-gold' : 'bg-red-400'}`}
          title={isConnected ? 'Connecté' : 'Déconnecté'}
        />
      </div>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {(
          [
            ['A', state.teamAName, state.teamAScore, state.teamAPlaying],
            ['B', state.teamBName, state.teamBScore, !state.teamAPlaying],
          ] as const
        ).map(([key, name, score, playing]) => (
          <div
            key={key}
            className={`rounded-2xl border-2 p-4 text-center transition-all duration-300
              ${playing && state.status === 'IN_PROGRESS'
                ? 'border-ff-gold bg-ff-card-mid ff-glow'
                : 'border-white/10 bg-ff-card'
              }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-ff-gold/60">
              {playing && state.status === 'IN_PROGRESS' ? '🎯 joue' : '\u00a0'}
            </p>
            <p className="truncate font-bold text-white">{name}</p>
            <p className={`text-3xl font-extrabold ${playing && state.status === 'IN_PROGRESS' ? 'text-ff-gold' : 'text-white/70'}`}>
              {score}
            </p>
          </div>
        ))}
      </div>

      {/* Fautes + Points du tour */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-ff-card px-4 py-3">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`text-xl ${i < state.currentFaults ? 'text-red-500' : 'text-white/15'}`}>✕</span>
            ))}
            <span className="ml-2 text-sm text-white/40">fautes</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-white/40">Tour : </span>
            <span className="font-bold text-ff-gold">{state.roundPoints} pts</span>
          </div>
        </div>
      )}

      {/* Question + Réponses */}
      {currentQuestion && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-ff-card p-4">
          <p className="mb-3 text-base font-bold text-white">{currentQuestion.text}</p>
          <div className="flex flex-col gap-2">
            {currentQuestion.answers.map((answer) => {
              const revealed = revealedAnswerIds.includes(answer.id)
              const isStealTarget = state.stealPhase && !revealed

              return (
                <button
                  key={answer.id}
                  disabled={revealed || (!state.stealPhase && state.status !== 'IN_PROGRESS') || !isCommander}
                  onClick={() => {
                    if (state.stealPhase) {
                      dispatch({ type: 'STEAL', answerId: answer.id })
                    } else if (!revealed) {
                      dispatch({ type: 'REVEAL_ANSWER', answerId: answer.id })
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all
                    ${revealed
                      ? 'border-ff-gold/40 bg-ff-card-mid text-white'
                      : isStealTarget
                        ? 'border-2 border-dashed border-orange-400 bg-orange-900/20 text-orange-300'
                        : 'border-white/10 bg-[#0d1835] text-white/30 hover:border-white/20 hover:text-white/60'
                    }`}
                >
                  <span className="mr-2 font-bold text-ff-gold/70">{answer.rank}.</span>
                  <span className="flex-1 text-left">
                    {revealed ? answer.text : (isStealTarget ? 'Cliquer pour voler' : '???')}
                  </span>
                  {revealed && <span className="ml-2 font-bold text-ff-gold">{answer.score} pts</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* WAITING → Démarrer */}
        {state.status === 'WAITING' && (
          <GoldButton onClick={() => dispatch({ type: 'START' })}>
            Démarrer la partie
          </GoldButton>
        )}

        {/* IN_PROGRESS — phase normale */}
        {state.status === 'IN_PROGRESS' && !state.stealPhase && (
          <>
            <button
              onClick={() => dispatch({ type: 'FAULT' })}
              className="w-full rounded-2xl border-2 border-red-500/60 bg-red-900/20 py-3 text-base font-bold text-red-400 transition hover:bg-red-900/40"
            >
              ✕ Faute
            </button>

            <div className="grid grid-cols-2 gap-3">
              <OutlineButton onClick={() => dispatch({ type: 'END_ROUND', teamA: true })}>
                Manche → {state.teamAName}
              </OutlineButton>
              <OutlineButton onClick={() => dispatch({ type: 'END_ROUND', teamA: false })}>
                Manche → {state.teamBName}
              </OutlineButton>
            </div>

            {state.currentQuestionIndex < state.totalQuestions - 1 ? (
              <OutlineButton onClick={() => dispatch({ type: 'NEXT_QUESTION' })}>
                Question suivante →
              </OutlineButton>
            ) : (
              <button
                onClick={() => dispatch({ type: 'FINISH' })}
                className="w-full rounded-2xl border border-red-500/40 bg-transparent py-3 font-bold text-red-400 transition hover:bg-red-900/20"
              >
                Terminer la partie
              </button>
            )}
          </>
        )}

        {/* IN_PROGRESS — phase de vol */}
        {state.status === 'IN_PROGRESS' && state.stealPhase && (
          <>
            <div className="rounded-xl border border-orange-400/30 bg-orange-900/20 px-4 py-3 text-center text-sm font-bold text-orange-300">
              🔥 Phase de vol — {state.teamAPlaying ? state.teamBName : state.teamAName} choisit une réponse
            </div>
            <button
              onClick={() => dispatch({ type: 'STEAL', answerId: -1 })}
              className="w-full rounded-2xl border-2 border-red-500/60 bg-red-900/20 py-3 font-bold text-red-400 transition hover:bg-red-900/40"
            >
              Réponse incorrecte — {state.teamAPlaying ? state.teamAName : state.teamBName} garde les points
            </button>
          </>
        )}

        {/* FINISHED */}
        {state.status === 'FINISHED' && (
          <div className="rounded-2xl border border-ff-gold/30 bg-ff-card p-6 text-center">
            <p className="mb-1 text-2xl font-black text-ff-gold">🏆 Partie terminée !</p>
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

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-ff-gold/40 bg-ff-card py-3 font-bold text-ff-gold transition hover:bg-ff-card-mid active:scale-95"
    >
      {children}
    </button>
  )
}

export default ControlPanelPage
