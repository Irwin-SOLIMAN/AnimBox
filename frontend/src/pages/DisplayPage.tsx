import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { gameSessionService } from '../services/gameSessionService'
import type { GameStateDTO } from '../types/gameSession'
import useWebSocket from '../hooks/useWebSocket'

const DisplayPage = () => {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)

  const [state, setState] = useState<GameStateDTO | null>(null)
  const [loading, setLoading] = useState(true)

  // IDs récemment révélés — pour déclencher l'animation d'apparition
  const [newlyRevealed, setNewlyRevealed] = useState<Set<number>>(new Set())
  const prevRevealedRef = useRef<Set<number>>(new Set())

  const updateState = (next: GameStateDTO) => {
    const prevRevealed = prevRevealedRef.current
    const nextRevealedSet = new Set(next.revealedAnswerIds)

    // Identifie les IDs qui viennent d'être révélés
    const justRevealed = new Set(
      next.revealedAnswerIds.filter((id) => !prevRevealed.has(id)),
    )

    if (justRevealed.size > 0) {
      setNewlyRevealed(justRevealed)
      setTimeout(() => setNewlyRevealed(new Set()), 700)
    }

    prevRevealedRef.current = nextRevealedSet
    setState(next)
  }

  useEffect(() => {
    gameSessionService
      .getState(sessionId)
      .then((s) => {
        prevRevealedRef.current = new Set(s.revealedAnswerIds)
        setState(s)
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  useWebSocket<GameStateDTO>({
    topic: `/topic/session/${sessionId}`,
    onMessage: updateState,
  })

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-darkest">
        <p className="text-2xl font-bold text-brand-light">En attente de la partie...</p>
      </div>
    )
  }

  const { currentQuestion, revealedAnswerIds } = state
  const revealedSet = new Set(revealedAnswerIds)

  // Sépare les réponses en deux colonnes style TV
  const answers = currentQuestion?.answers ?? []
  const mid = Math.ceil(answers.length / 2)
  const leftAnswers = answers.slice(0, mid)
  const rightAnswers = answers.slice(mid)

  return (
    <div className="flex min-h-screen flex-col bg-brand-darkest p-6 font-bold">

      {/* Scores */}
      <div className="mb-6 grid grid-cols-2 gap-6">
        {[
          { name: state.teamAName, score: state.teamAScore, playing: state.teamAPlaying },
          { name: state.teamBName, score: state.teamBScore, playing: !state.teamAPlaying },
        ].map((team, i) => (
          <div
            key={i}
            className={`rounded-2xl px-8 py-5 text-center transition-all duration-500 ${
              team.playing && state.status === 'IN_PROGRESS'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/40'
                : 'bg-brand-dark/60 text-brand-light'
            }`}
          >
            <p className="text-lg uppercase tracking-widest opacity-80">{team.name}</p>
            <p className="text-6xl">{team.score}</p>
          </div>
        ))}
      </div>

      {/* Fautes + Points du tour */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-white/5 px-8 py-4">
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`text-4xl ${i < state.currentFaults ? 'text-red-400' : 'text-white/15'}`}>
                ✕
              </span>
            ))}
          </div>
          <p className="text-xl text-brand-light">
            Points du tour : <span className="text-3xl text-white">{state.roundPoints}</span>
          </p>
        </div>
      )}

      {/* Phase de vol */}
      {state.stealPhase && (
        <div className="mb-6 animate-pulse rounded-2xl bg-orange-500/20 px-8 py-4 text-center">
          <p className="text-2xl text-orange-300">
            🔥 {state.teamAPlaying ? state.teamBName : state.teamAName} — Tentative de vol !
          </p>
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <>
          <div className="mb-6 rounded-2xl bg-brand-dark/40 px-8 py-6 text-center">
            <p className="text-3xl leading-snug text-white">{currentQuestion.text}</p>
          </div>

          {/* Tableau des réponses — 2 colonnes */}
          <div className="grid flex-1 grid-cols-2 gap-4">
            {[leftAnswers, rightAnswers].map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4">
                {col.map((answer) => {
                  const revealed = revealedSet.has(answer.id)
                  const isNew = newlyRevealed.has(answer.id)

                  return (
                    <div
                      key={answer.id}
                      className={`flex items-center justify-between rounded-xl px-6 py-4 transition-all duration-500 ${
                        revealed
                          ? `bg-brand-primary text-white ${isNew ? 'scale-105 shadow-lg shadow-brand-primary/50' : 'scale-100'}`
                          : 'bg-brand-dark/50 text-brand-dark'
                      }`}
                    >
                      <span className="text-2xl opacity-60">{answer.rank}.</span>
                      <span className="mx-4 flex-1 text-center text-2xl">
                        {revealed ? answer.text : '▬▬▬▬▬▬'}
                      </span>
                      <span className="text-2xl">
                        {revealed ? `${answer.score} pts` : '?'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Écran fin de partie */}
      {state.status === 'FINISHED' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-5xl text-white">Partie terminée !</p>
          <p className="text-3xl text-brand-light">
            {state.teamAScore > state.teamBScore
              ? `🏆 ${state.teamAName} gagne !`
              : state.teamBScore > state.teamAScore
                ? `🏆 ${state.teamBName} gagne !`
                : '🤝 Égalité !'}
          </p>
        </div>
      )}

      {/* Écran attente */}
      {state.status === 'WAITING' && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-3xl text-brand-light opacity-60">La partie va bientôt commencer...</p>
        </div>
      )}
    </div>
  )
}

export default DisplayPage
