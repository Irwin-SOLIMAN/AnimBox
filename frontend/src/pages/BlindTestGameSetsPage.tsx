import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blindTestService } from '../services/blindTestService'
import { gameSessionService } from '../services/gameSessionService'
import type { BlindTestSetResponse, BlindTestTrackDTO, DeezerSearchResult } from '../types/blindTest'

const BG = 'radial-gradient(ellipse at 50% 20%, #1a3570 0%, #080f22 70%)'
const GOLD = '#f4b942'

export default function BlindTestGameSetsPage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState<BlindTestSetResponse[]>([])
  const [selectedSet, setSelectedSet] = useState<BlindTestSetResponse | null>(null)
  const [tracks, setTracks] = useState<BlindTestTrackDTO[]>([])
  const [newSetName, setNewSetName] = useState('')
  const [loading, setLoading] = useState(true)

  // Session creation
  const [showLaunch, setShowLaunch] = useState(false)
  const [teamA, setTeamA] = useState('Équipe A')
  const [teamB, setTeamB] = useState('Équipe B')
  const [launching, setLaunching] = useState(false)

  // Deezer search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DeezerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    blindTestService.getSets().then(setSets).finally(() => setLoading(false))
  }, [])

  const selectSet = async (set: BlindTestSetResponse) => {
    setSelectedSet(set)
    const t = await blindTestService.getTracks(set.id)
    setTracks(t)
    setShowLaunch(false)
    setResults([])
    setQuery('')
  }

  const createSet = async () => {
    if (!newSetName.trim()) return
    const s = await blindTestService.createSet(newSetName.trim())
    setSets((prev) => [...prev, s])
    setNewSetName('')
    selectSet(s)
  }

  const deleteTrack = async (trackId: number) => {
    await blindTestService.deleteTrack(trackId)
    setTracks((prev) => prev.filter((t) => t.id !== trackId))
  }

  const addFromDeezer = async (r: DeezerSearchResult) => {
    if (!selectedSet) return
    const track = await blindTestService.addTrack(selectedSet.id, {
      title: r.title,
      artist: r.artist,
      deezerTrackId: r.id,
      pointsValue: 1,
    })
    setTracks((prev) => [...prev, track])
    setResults((prev) => prev.filter((x) => x.id !== r.id))
  }

  const handleSearch = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const r = await blindTestService.searchDeezer(q)
      setResults(r)
      setSearching(false)
    }, 500)
  }

  const previewTrack = (url: string, id: number) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.play()
      setPlayingId(id)
    }
  }

  const launchSession = async () => {
    if (!selectedSet) return
    setLaunching(true)
    try {
      const session = await gameSessionService.create({
        gameSetId: selectedSet.id,
        teamAName: teamA,
        teamBName: teamB,
      })
      navigate(`/blind-test/${session.token}/control`)
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="min-h-screen p-6 pb-16" style={{ background: BG }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate('/games')} className="mb-4 text-sm text-white/50 hover:text-white">
          ← Retour
        </button>
        <h1 className="mb-6 text-2xl font-black text-white">
          🎵 Blind Test — Mes playlists
        </h1>

        {/* Créer un nouveau set */}
        <div className="mb-6 flex gap-2">
          <input
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createSet()}
            placeholder="Nom de la nouvelle playlist..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-yellow-400/60 focus:outline-none"
          />
          <button
            onClick={createSet}
            className="rounded-xl px-5 py-2 font-bold text-[#0a1628]"
            style={{ background: `linear-gradient(180deg, #fdd876 0%, ${GOLD} 50%, #c4922e 100%)` }}
          >
            +
          </button>
        </div>

        {/* Liste des sets */}
        {loading ? (
          <p className="text-white/50">Chargement...</p>
        ) : (
          <div className="mb-6 flex flex-col gap-2">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSet(s)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  selectedSet?.id === s.id
                    ? 'border-yellow-400/60 bg-yellow-400/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">{s.name}</span>
                {s.isPublic && (
                  <span className="ml-2 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-300">
                    Preset
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Contenu du set sélectionné */}
        {selectedSet && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedSet.name}</h2>
              <button
                onClick={() => setShowLaunch(!showLaunch)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#0a1628]"
                style={{ background: `linear-gradient(180deg, #fdd876 0%, ${GOLD} 50%, #c4922e 100%)` }}
              >
                🎮 Lancer
              </button>
            </div>

            {/* Panel de lancement */}
            {showLaunch && (
              <div className="mb-5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <p className="mb-3 text-sm font-bold text-yellow-300">Noms des équipes</p>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <input
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <input
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={launchSession}
                  disabled={launching}
                  className="w-full rounded-xl py-3 font-black text-[#0a1628] disabled:opacity-50"
                  style={{ background: `linear-gradient(180deg, #fdd876 0%, ${GOLD} 50%, #c4922e 100%)` }}
                >
                  {launching ? 'Lancement...' : '▶ Démarrer la session'}
                </button>
              </div>
            )}

            {/* Pistes actuelles */}
            <div className="mb-4 flex flex-col gap-2">
              {tracks.length === 0 && (
                <p className="text-sm text-white/30">Aucune piste. Recherchez des sons ci-dessous.</p>
              )}
              {tracks.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="w-5 text-center text-sm font-bold text-white/30">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                    <p className="truncate text-xs text-white/50">{t.artist}</p>
                  </div>
                  {!selectedSet.isPublic && (
                    <button
                      onClick={() => deleteTrack(t.id)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Recherche Deezer */}
            {!selectedSet.isPublic && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">
                  Ajouter via Deezer
                </p>
                <input
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Titre, artiste..."
                  className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-yellow-400/60 focus:outline-none"
                />
                {searching && <p className="text-xs text-white/40">Recherche...</p>}
                <div className="flex flex-col gap-2">
                  {results.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <button
                        onClick={() => previewTrack(r.previewUrl, r.id)}
                        className="text-lg"
                        title="Écouter l'aperçu"
                      >
                        {playingId === r.id ? '⏸' : '▶'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                        <p className="truncate text-xs text-white/50">{r.artist}</p>
                      </div>
                      <button
                        onClick={() => addFromDeezer(r)}
                        className="shrink-0 rounded-lg bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300 hover:bg-yellow-400/30"
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
