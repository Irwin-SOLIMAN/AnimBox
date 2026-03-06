import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameSessionService } from '../services/gameSessionService'
import type { GameStateDTO, ActionDTO } from '../types/gameSession'
import useWebSocket from '../hooks/useWebSocket'
import Button from '../components/ui/Button'

const ControlPanelPage = () => {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  const navigate = useNavigate()

  const [state, setState] = useState<GameStateDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Charge l'état initial via REST (avant la connexion WebSocket)
  useEffect(() => {
    gameSessionService
      .getState(sessionId)
      .then(setState)
      .catch(() => setError('Impossible de charger la session'))
      .finally(() => setLoading(false))
  }, [sessionId])

  // WebSocket — met à jour l'état à chaque action
  const { send, isConnected } = useWebSocket<GameStateDTO>({
    topic: `/topic/session/${sessionId}`,
    onMessage: setState,
    onError: (msg) => setError(msg),
  })

  const dispatch = (action: ActionDTO) => {
    send(`/app/session/${sessionId}/action`, action)
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-white">Chargement...</div>
  if (error || !state) return <div className="flex min-h-screen items-center justify-center text-red-400">{error || 'Session introuvable'}</div>

  const { currentQuestion, revealedAnswerIds } = state

  return (
    <div className="min-h-screen p-4 pb-8">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/games')} className="text-sm text-brand-primary hover:underline">
          ← Quitter
        </button>
        <span className="text-sm font-medium text-brand-light">
          Question {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </span>
        <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} title={isConnected ? 'Connecté' : 'Déconnecté'} />
      </div>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {([['A', state.teamAName, state.teamAScore, state.teamAPlaying], ['B', state.teamBName, state.teamBScore, !state.teamAPlaying]] as const).map(([key, name, score, playing]) => (
          <div key={key} className={`rounded-2xl p-4 text-center ${playing && state.status === 'IN_PROGRESS' ? 'bg-brand-primary text-white' : 'bg-white text-brand-darkest'}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{playing && state.status === 'IN_PROGRESS' ? '🎯 joue' : '\u00a0'}</p>
            <p className="truncate font-bold">{name}</p>
            <p className="text-3xl font-extrabold">{score}</p>
          </div>
        ))}
      </div>

      {/* Fautes + Points du tour */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`text-xl ${i < state.currentFaults ? 'text-red-400' : 'text-white/20'}`}>✕</span>
            ))}
            <span className="ml-2 text-sm text-brand-light">fautes</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-brand-light">Tour : </span>
            <span className="font-bold text-white">{state.roundPoints} pts</span>
          </div>
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <div className="mb-4 rounded-2xl bg-white p-4">
          <p className="mb-3 text-base font-bold text-brand-darkest">{currentQuestion.text}</p>
          <div className="flex flex-col gap-2">
            {currentQuestion.answers.map((answer) => {
              const revealed = revealedAnswerIds.includes(answer.id)
              const isStealTarget = state.stealPhase && !revealed

              return (
                <button
                  key={answer.id}
                  disabled={revealed || (!state.stealPhase && state.status !== 'IN_PROGRESS')}
                  onClick={() => {
                    if (state.stealPhase) {
                      dispatch({ type: 'STEAL', answerId: answer.id })
                    } else if (!revealed) {
                      dispatch({ type: 'REVEAL_ANSWER', answerId: answer.id })
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors
                    ${revealed
                      ? 'bg-brand-primary text-white'
                      : isStealTarget
                        ? 'border-2 border-dashed border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-brand-light hover:text-brand-darkest'
                    }`}
                >
                  <span className="mr-2 font-bold">{answer.rank}.</span>
                  <span className="flex-1 text-left">{revealed ? answer.text : (isStealTarget ? 'Cliquer pour voler' : '???')}</span>
                  {revealed && <span className="ml-2 font-bold">{answer.score} pts</span>}
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
          <Button className="w-full py-4 text-lg" onClick={() => dispatch({ type: 'START' })}>
            Démarrer la partie
          </Button>
        )}

        {/* IN_PROGRESS — phase normale */}
        {state.status === 'IN_PROGRESS' && !state.stealPhase && (
          <>
            <Button
              variant="ghost"
              className="w-full border-2 border-red-400 py-3 text-base text-red-400 hover:bg-red-50"
              onClick={() => dispatch({ type: 'FAULT' })}
            >
              ✕ Faute
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="py-3"
                onClick={() => dispatch({ type: 'END_ROUND', teamA: true })}
              >
                Manche → {state.teamAName}
              </Button>
              <Button
                variant="secondary"
                className="py-3"
                onClick={() => dispatch({ type: 'END_ROUND', teamA: false })}
              >
                Manche → {state.teamBName}
              </Button>
            </div>

            {state.currentQuestionIndex < state.totalQuestions - 1 ? (
              <Button variant="ghost" className="w-full py-3" onClick={() => dispatch({ type: 'NEXT_QUESTION' })}>
                Question suivante →
              </Button>
            ) : (
              <Button variant="ghost" className="w-full py-3 text-red-400" onClick={() => dispatch({ type: 'FINISH' })}>
                Terminer la partie
              </Button>
            )}
          </>
        )}

        {/* IN_PROGRESS — phase de vol */}
        {state.status === 'IN_PROGRESS' && state.stealPhase && (
          <>
            <div className="rounded-xl bg-orange-100 px-4 py-3 text-center text-sm font-medium text-orange-700">
              🔥 Phase de vol — {state.teamAPlaying ? state.teamBName : state.teamAName} choisit une réponse
            </div>
            <Button
              variant="ghost"
              className="w-full border-2 border-red-400 py-3 text-red-400"
              onClick={() => dispatch({ type: 'STEAL', answerId: -1 })}
            >
              Réponse incorrecte — {state.teamAPlaying ? state.teamAName : state.teamBName} garde les points
            </Button>
          </>
        )}

        {/* FINISHED */}
        {state.status === 'FINISHED' && (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="mb-2 text-lg font-bold text-brand-darkest">Partie terminée !</p>
            <p className="mb-4 text-sm text-gray-500">
              {state.teamAScore > state.teamBScore
                ? `🏆 ${state.teamAName} gagne !`
                : state.teamBScore > state.teamAScore
                  ? `🏆 ${state.teamBName} gagne !`
                  : 'Égalité !'}
            </p>
            <Button className="w-full" onClick={() => navigate('/games')}>
              Retour à l'accueil
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ControlPanelPage
