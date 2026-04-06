import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameTypeService } from '../services/gameTypeService'
import type { GameType } from '../types/gameType'

const BG = 'radial-gradient(ellipse at 50% 0%, #1a0a3d 0%, #070B14 70%)'

const toRoute = (code: string) => code.toLowerCase().replace(/_/g, '-')

const GAME_META: Record<string, { icon: string; accent: string; accentText: string }> = {
  FAMILY_FEUD: {
    icon: '🎯',
    accent: 'linear-gradient(135deg, #162550 0%, #1e3a70 100%)',
    accentText: '#f4b942',
  },
  BLIND_TEST: {
    icon: '🎵',
    accent: 'linear-gradient(135deg, #1a0a3d 0%, #2d1065 100%)',
    accentText: '#a78bfa',
  },
}

const GamesPage = () => {
  const navigate = useNavigate()
  const [gameTypes, setGameTypes] = useState<GameType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    gameTypeService
      .findAll()
      .then(setGameTypes)
      .catch(() => setError('Impossible de charger les jeux'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: BG }}>
      {/* Header */}
      <div className="mb-10">
        <p className="text-3xl font-black tracking-tight" style={{ color: '#f4b942' }}>
          Anim<span className="text-white">Box</span>
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">Mes jeux</h1>
        <p className="mt-1 text-sm text-white/30">Choisissez un jeu pour démarrer une session</p>
      </div>

      {loading && <p className="text-white/40">Chargement...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gameTypes.map((game) => {
          const meta = GAME_META[game.code] ?? {
            icon: '🎮',
            accent: 'linear-gradient(135deg, #111 0%, #222 100%)',
            accentText: '#f4b942',
          }
          const isBlindTest = game.code === 'BLIND_TEST'

          return (
            <div
              key={game.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/8"
              style={{ background: meta.accent }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-3xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-white truncate">{game.name}</h2>
                  <span className="text-xs font-medium" style={{ color: meta.accentText }}>
                    {game.maxPlayers} joueurs max
                  </span>
                </div>
              </div>

              {/* Description */}
              {game.description && (
                <p className="flex-1 px-5 pb-4 text-sm text-white/40">{game.description}</p>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-col gap-2 border-t border-white/8 p-4">
                {!isBlindTest && (
                  <button
                    onClick={() => navigate(`/games/${toRoute(game.code)}/questions`)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition"
                  >
                    Gérer les questions
                  </button>
                )}
                <button
                  onClick={() => navigate(`/games/${toRoute(game.code)}/game-sets`)}
                  className="w-full rounded-xl py-2.5 text-sm font-black uppercase tracking-wide text-[#070B14] transition active:scale-95"
                  style={{ background: `linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)` }}
                >
                  {isBlindTest ? 'Gérer les playlists' : 'Gérer les parties'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GamesPage
