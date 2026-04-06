import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { gameSessionService } from '../services/gameSessionService'
import type { GameStateDTO } from '../types/gameSession'
import useWebSocket from '../hooks/useWebSocket'

const FF_BG = 'radial-gradient(ellipse at 50% 30%, #1a3570 0%, #080f22 65%)'

const DisplayPage = () => {
  const { id: token } = useParams<{ id: string }>()

  const [state, setState] = useState<GameStateDTO | null>(null)
  const [sessionId, setSessionId] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const [newlyRevealed, setNewlyRevealed] = useState<Set<number>>(new Set())
  const prevRevealedRef = useRef<Set<number>>(new Set())

  const updateState = (next: GameStateDTO) => {
    const prevRevealed = prevRevealedRef.current
    const nextRevealedSet = new Set(next.revealedAnswerIds)
    const justRevealed = new Set(next.revealedAnswerIds.filter((id) => !prevRevealed.has(id)))

    if (justRevealed.size > 0) {
      setNewlyRevealed(justRevealed)
      setTimeout(() => setNewlyRevealed(new Set()), 700)
    }

    prevRevealedRef.current = nextRevealedSet
    setState(next)
  }

  useEffect(() => {
    if (!token) return
    gameSessionService
      .getStateByToken(token)
      .then((s) => {
        setSessionId(s.sessionId)
        prevRevealedRef.current = new Set(s.revealedAnswerIds)
        setState(s)
      })
      .finally(() => setLoading(false))
  }, [token])

  useWebSocket<GameStateDTO>({
    topic: sessionId ? `/topic/session/${sessionId}` : '',
    onMessage: updateState,
  })

  if (loading || !state) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: FF_BG }}>
        <div className="text-center">
          <FfTitle />
          <p className="mt-4 text-xl font-bold text-ff-gold/70 animate-pulse">
            En attente de la partie...
          </p>
        </div>
      </div>
    )
  }

  const { currentQuestion, revealedAnswerIds } = state
  const revealedSet = new Set(revealedAnswerIds)
  const answers = currentQuestion?.answers ?? []
  const mid = Math.ceil(answers.length / 2)
  const leftAnswers = answers.slice(0, mid)
  const rightAnswers = answers.slice(mid)

  return (
    <div
      className="flex h-screen flex-col overflow-hidden select-none"
      style={{ background: FF_BG, padding: '16px 24px 12px' }}
    >
      {/* ── Titre ── */}
      <div className="mb-2 text-center">
        <FfTitle />
      </div>

      {/* ── Scores ── */}
      <div className="mb-2 grid grid-cols-2 gap-4">
        {[
          { name: state.teamAName, score: state.teamAScore, playing: state.teamAPlaying },
          { name: state.teamBName, score: state.teamBScore, playing: !state.teamAPlaying },
        ].map((team, i) => (
          <div
            key={i}
            className={`rounded-2xl border-2 px-6 py-3 text-center transition-all duration-500
              ${team.playing && state.status === 'IN_PROGRESS'
                ? 'border-ff-gold bg-ff-card-mid ff-glow'
                : 'border-white/10 bg-ff-card'
              }`}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">{team.name}</p>
            <p className={`text-5xl tabular-nums font-black leading-tight ${
              team.playing && state.status === 'IN_PROGRESS' ? 'text-ff-gold' : 'text-white/80'
            }`}>
              {team.score}
            </p>
          </div>
        ))}
      </div>

      {/* ── Fautes + Points + Phase de vol (même ligne) ── */}
      {state.status === 'IN_PROGRESS' && (
        <div className="mb-2 flex items-center gap-3">
          {/* Fautes */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ff-card px-5 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`text-3xl transition-all duration-300 ${
                  i < state.currentFaults ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'text-white/10'
                }`}
              >
                ✕
              </span>
            ))}
          </div>

          {/* Phase de vol — au centre si active */}
          {state.stealPhase && (
            <div className="flex-1 animate-pulse rounded-xl border border-orange-400/40 bg-orange-900/20 px-5 py-2 text-center">
              <p className="text-lg font-black text-orange-300">
                🔥 {state.teamAPlaying ? state.teamBName : state.teamAName} — Tentative de vol !
              </p>
            </div>
          )}

          {/* Points du tour */}
          <div className="ml-auto rounded-xl border border-white/10 bg-ff-card px-5 py-2 text-right">
            <span className="text-sm text-white/40">Tour </span>
            <span className="text-3xl font-black text-ff-gold">{state.roundPoints}</span>
          </div>
        </div>
      )}

      {/* ── Question ── */}
      {currentQuestion && (
        <>
          <div className="mb-2 rounded-2xl border border-ff-gold/30 bg-ff-card px-6 py-3 text-center">
            <p className="text-2xl font-bold leading-snug text-white">{currentQuestion.text}</p>
          </div>

          {/* ── Réponses — 2 colonnes ── */}
          <div className="grid flex-1 grid-cols-2 gap-3" style={{ minHeight: 0 }}>
            {[leftAnswers, rightAnswers].map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2">
                {col.map((answer) => {
                  const revealed = revealedSet.has(answer.id)
                  const isNew = newlyRevealed.has(answer.id)

                  return (
                    <div
                      key={answer.id}
                      className={`flex flex-1 items-center justify-between rounded-xl border px-5 py-3 transition-all duration-500
                        ${revealed
                          ? `border-ff-gold/50 bg-ff-card-mid text-white ${isNew ? 'ff-answer-reveal' : ''}`
                          : 'border-white/5 bg-[#0d1835] text-transparent'
                        }`}
                    >
                      <span className={`text-xl font-black ${revealed ? 'text-ff-gold' : 'text-white/10'}`}>
                        {answer.rank}.
                      </span>
                      <span className="mx-3 flex-1 text-center text-xl font-bold">
                        {revealed ? answer.text : '▬▬▬▬▬▬'}
                      </span>
                      <span className={`text-xl font-black ${revealed ? 'text-ff-gold' : 'text-white/10'}`}>
                        {revealed ? answer.score : '?'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Fin de partie ── */}
      {state.status === 'FINISHED' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-5xl font-black text-ff-gold drop-shadow-lg">🏆 Partie terminée !</p>
          <p className="text-3xl text-white">
            {state.teamAScore > state.teamBScore
              ? `${state.teamAName} gagne !`
              : state.teamBScore > state.teamAScore
                ? `${state.teamBName} gagne !`
                : '🤝 Égalité !'}
          </p>
        </div>
      )}

      {/* ── Attente ── */}
      {state.status === 'WAITING' && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-2xl text-white/30">La partie va bientôt commencer...</p>
        </div>
      )}
    </div>
  )
}

function FfTitle() {
  return (
    <div className="inline-block">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-ff-gold/70">Une</p>
      <h1
        className="text-4xl font-black uppercase tracking-wider text-ff-gold"
        style={{ textShadow: '0 0 20px rgba(244,185,66,0.55), 0 2px 0 rgba(0,0,0,0.5)' }}
      >
        Famille en Or
      </h1>
    </div>
  )
}

export default DisplayPage
