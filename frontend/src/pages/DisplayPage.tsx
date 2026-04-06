import { useEffect, useMemo, useRef, useState } from 'react'
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

  if (state.status === 'FINISHED') {
    return <VictoryScreen state={state} />
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
            <p className={`text-5xl tabular-nums font-black leading-tight transition-all duration-300 ${
              team.playing && state.status === 'IN_PROGRESS' ? 'text-ff-gold' : 'text-white/80'
            }`}>
              {state.hideScores ? '?' : team.score}
            </p>
          </div>
        ))}
      </div>

      {/* ── Manche BONUS indicator ── */}
      {state.status === 'IN_PROGRESS' && state.roundMultiplier > 1 && (
        <div
          className="mb-2 rounded-xl px-4 py-1.5 text-center"
          style={{
            background: state.roundMultiplier === 3
              ? 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(244,185,66,0.18) 50%, rgba(239,68,68,0.15) 100%)'
              : 'linear-gradient(90deg, rgba(251,146,60,0.12) 0%, rgba(244,185,66,0.18) 50%, rgba(251,146,60,0.12) 100%)',
            border: state.roundMultiplier === 3 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(244,185,66,0.35)',
          }}
        >
          <span
            className="text-lg font-black uppercase tracking-[0.3em]"
            style={{
              color: state.roundMultiplier === 3 ? '#ff6b6b' : '#f4b942',
              textShadow: state.roundMultiplier === 3
                ? '0 0 16px rgba(239,68,68,0.6)'
                : '0 0 16px rgba(244,185,66,0.55)',
              animation: 'ff-bonus-pulse 2s ease-in-out infinite',
            }}
          >
            ✦ MANCHE BONUS ×{state.roundMultiplier} ✦
          </span>
        </div>
      )}

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
            <span className="text-3xl font-black text-ff-gold">
              {state.roundPoints * state.roundMultiplier}
            </span>
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

      {/* ── Attente ── */}
      {state.status === 'WAITING' && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-2xl text-white/30">La partie va bientôt commencer...</p>
        </div>
      )}
    </div>
  )
}

function VictoryScreen({ state }: { state: GameStateDTO }) {
  const isTeamAWinner = state.teamAScore > state.teamBScore
  const isTie = state.teamAScore === state.teamBScore
  const winnerName = isTie ? null : isTeamAWinner ? state.teamAName : state.teamBName

  const pieces = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3.5 + Math.random() * 2.5,
      color: ['#f4b942', '#fdd876', '#c4922e', '#ffffff', '#ff9800', '#ff5252', '#a78bfa'][i % 7],
      width: 7 + Math.random() * 9,
      height: 5 + Math.random() * 7,
      isCircle: i % 3 === 0,
    })), [])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: FF_BG }}
    >
      {/* Confetti */}
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.left}%`,
            top: '-30px',
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `ff-confetti-fall ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}

      {/* Contenu centré */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-12">

        {/* Trophée / emoji animé */}
        <div style={{ fontSize: '110px', lineHeight: 1, animation: 'ff-trophy-float 1.8s ease-in-out infinite alternate' }}>
          {isTie ? '🤝' : '🏆'}
        </div>

        {/* Vainqueur */}
        {winnerName ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold uppercase tracking-[0.5em] text-white/40">
              Vainqueur
            </p>
            <p
              className="text-7xl font-black text-ff-gold"
              style={{ textShadow: '0 0 50px rgba(244,185,66,0.75), 0 0 20px rgba(244,185,66,0.4), 0 3px 0 rgba(0,0,0,0.5)' }}
            >
              {winnerName}
            </p>
          </div>
        ) : (
          <p className="text-5xl font-black text-white">Égalité !</p>
        )}

        {/* Scores des 2 équipes */}
        <div className="flex gap-8">
          {[
            { name: state.teamAName, score: state.teamAScore, won: !isTie && isTeamAWinner },
            { name: state.teamBName, score: state.teamBScore, won: !isTie && !isTeamAWinner },
          ].map((team, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 px-12 py-5 text-center transition-all
                ${team.won ? 'border-ff-gold bg-ff-gold/10 ff-glow' : 'border-white/10 bg-ff-card'}`}
            >
              <p className="text-sm uppercase tracking-[0.25em] text-white/40">{team.name}</p>
              <p className={`text-6xl font-black tabular-nums ${team.won ? 'text-ff-gold' : 'text-white/50'}`}>
                {team.score}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-white/20 uppercase tracking-widest">Partie terminée</p>
      </div>
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
