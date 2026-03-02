import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameTypeService } from '../services/gameTypeService'
import type { GameType } from '../types/gameType'
import Button from '../components/ui/Button'

const toRoute = (code: string) => code.toLowerCase().replace(/_/g, '-')

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
    <div className="min-h-screen p-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Mes jeux</h1>

      {loading && <p className="text-brand-light">Chargement...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gameTypes.map((game) => (
          <div
            key={game.id}
            className="flex flex-col rounded-2xl bg-white p-6 shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-bold text-brand-darkest">{game.name}</h2>
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark">
                {game.maxPlayers} joueurs max
              </span>
            </div>

            {game.description && (
              <p className="mb-6 flex-1 text-sm text-gray-500">{game.description}</p>
            )}

            <Button
              className="w-full"
              onClick={() => navigate(`/games/${toRoute(game.code)}/questions`)}
            >
              Gérer les questions
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GamesPage
