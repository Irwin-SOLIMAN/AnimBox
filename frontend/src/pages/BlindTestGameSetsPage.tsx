import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blindTestService } from '../services/blindTestService'
import type { BlindTestSetResponse, BlindTestTrackDTO, DeezerSearchResult, BlindTestSessionDTO } from '../types/blindTest'

const BG = 'radial-gradient(ellipse at 50% 20%, #1a0a3d 0%, #080f22 70%)'

export default function BlindTestGameSetsPage() {
  const navigate = useNavigate()

  const [sets, setSets] = useState<BlindTestSetResponse[]>([])
  const [sessions, setSessions] = useState<BlindTestSessionDTO[]>([])
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null)
  const [tracksMap, setTracksMap] = useState<Record<number, BlindTestTrackDTO[]>>({})
  const [newSetName, setNewSetName] = useState('')
  const [newSetNameError, setNewSetNameError] = useState(false)
  const [loadingTracks, setLoadingTracks] = useState<number | null>(null)
  const [tab, setTab] = useState<'playlists' | 'sessions'>('playlists')
  const [deleteSessionError, setDeleteSessionError] = useState('')
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null)
  const [deleteSetConfirmId, setDeleteSetConfirmId] = useState<number | null>(null)

  // Session launch state
  const [launchSetId, setLaunchSetId] = useState<number | null>(null)
  const [teamNames, setTeamNames] = useState(['Équipe A', 'Équipe B'])
  const [launching, setLaunching] = useState(false)

  // Deezer search
  const [searchSetId, setSearchSetId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DeezerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    blindTestService.getSets().then(setSets)
    blindTestService.getSessions().then(setSessions)
  }, [])

  // Toggle accordion
  const toggleSet = async (set: BlindTestSetResponse) => {
    if (expandedSetId === set.id) {
      setExpandedSetId(null)
      return
    }
    setExpandedSetId(set.id)
    if (!tracksMap[set.id]) {
      setLoadingTracks(set.id)
      const t = await blindTestService.getTracks(set.id)
      setTracksMap((prev) => ({ ...prev, [set.id]: t }))
      setLoadingTracks(null)
    }
  }

  const createSet = async () => {
    if (!newSetName.trim()) {
      setNewSetNameError(true)
      setTimeout(() => setNewSetNameError(false), 2000)
      return
    }
    const s = await blindTestService.createSet(newSetName.trim())
    setSets((prev) => [...prev, s])
    setTracksMap((prev) => ({ ...prev, [s.id]: [] }))
    setExpandedSetId(s.id)
    setNewSetName('')
    // Scroll to new set after render
    setTimeout(() => {
      document.getElementById(`set-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const deleteTrack = async (setId: number, trackId: number) => {
    await blindTestService.deleteTrack(trackId)
    setTracksMap((prev) => ({ ...prev, [setId]: prev[setId].filter((t) => t.id !== trackId) }))
  }

  const addFromDeezer = async (r: DeezerSearchResult) => {
    if (!searchSetId) return
    const track = await blindTestService.addTrack(searchSetId, {
      title: r.title, artist: r.artist, deezerTrackId: r.id, pointsValue: 1,
    })
    setTracksMap((prev) => ({ ...prev, [searchSetId]: [...(prev[searchSetId] ?? []), track] }))
    setResults((prev) => prev.filter((x) => x.id !== r.id))
  }

  const handleSearch = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      setResults(await blindTestService.searchDeezer(q))
      setSearching(false)
    }, 500)
  }

  const openSearch = (setId: number) => {
    setSearchSetId(searchSetId === setId ? null : setId)
    setQuery('')
    setResults([])
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

  const openLaunch = (setId: number) => {
    setLaunchSetId(launchSetId === setId ? null : setId)
    setTeamNames(['Équipe A', 'Équipe B'])
  }

  const addTeam = () => {
    setTeamNames((p) => [...p, `Équipe ${p.length + 1}`])
  }

  const removeTeam = (i: number) => {
    if (teamNames.length > 2) setTeamNames((p) => p.filter((_, idx) => idx !== i))
  }

  const launchSession = async () => {
    if (!launchSetId) return
    setLaunching(true)
    try {
      const session = await blindTestService.createSession(launchSetId, teamNames)
      navigate(`/blind-test/${session.token}/control`)
    } finally {
      setLaunching(false)
    }
  }

  const deleteSession = async (id: number) => {
    setDeletingSessionId(id)
    setDeleteSessionError('')
    try {
      await blindTestService.deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setDeleteSessionError('Impossible de supprimer la session. Réessaie.')
    } finally {
      setDeletingSessionId(null)
    }
  }

  const deleteSet = async (id: number) => {
    try {
      await blindTestService.deleteSet(id)
      setSets((prev) => prev.filter((s) => s.id !== id))
      if (expandedSetId === id) setExpandedSetId(null)
    } catch {
      setDeleteSessionError('Impossible de supprimer la playlist.')
    } finally {
      setDeleteSetConfirmId(null)
    }
  }

  return (
    <div className="min-h-screen p-5 pb-16" style={{ background: BG }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate('/games')} className="mb-4 text-sm text-white/40 hover:text-white">
          ← Retour
        </button>
        <h1 className="mb-5 text-2xl font-black text-white">🎵 Blind Test</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {(['playlists', 'sessions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all
                ${tab === t ? 'bg-yellow-400 text-[#0a1628]' : 'text-white/50 hover:text-white'}`}
            >
              {t === 'playlists' ? '📋 Playlists' : `🎮 Sessions en cours (${sessions.length})`}
            </button>
          ))}
        </div>

        {/* ── PLAYLISTS TAB ── */}
        {tab === 'playlists' && (
          <>
            {/* Créer playlist */}
            <div className="mb-5">
              <div className="flex gap-2">
                <input
                  value={newSetName}
                  onChange={(e) => { setNewSetName(e.target.value); setNewSetNameError(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && createSet()}
                  placeholder="Nom de la nouvelle playlist..."
                  className={`flex-1 rounded-xl border bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition ${
                    newSetNameError ? 'border-red-400/60 placeholder-red-400/60' : 'border-white/10 focus:border-yellow-400/50'
                  }`}
                />
                <button
                  onClick={createSet}
                  className="rounded-xl px-5 py-2 text-sm font-black text-[#0a1628]"
                  style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
                >
                  + Créer
                </button>
              </div>
              {newSetNameError && (
                <p className="mt-1 text-xs text-red-400">Renseigne d'abord un nom pour la playlist.</p>
              )}
            </div>

            {/* Liste accordion */}
            <div className="flex flex-col gap-3">
              {sets.map((set) => {
                const isOpen = expandedSetId === set.id
                const tracks = tracksMap[set.id] ?? []
                const isLaunching = launchSetId === set.id
                const isSearching = searchSetId === set.id

                return (
                  <div key={set.id} id={`set-${set.id}`} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleSet(set)}
                        className="flex flex-1 items-center justify-between px-5 py-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                          <span className="font-semibold text-white">{set.name}</span>
                          {set.isPublic && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">
                              Défaut
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/30">
                          {tracksMap[set.id] ? `${tracksMap[set.id].length} pistes` : ''}
                        </span>
                      </button>
                      {!set.isPublic && deleteSetConfirmId !== set.id && (
                        <button
                          onClick={() => setDeleteSetConfirmId(set.id)}
                          className="mr-3 shrink-0 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400/50 hover:bg-red-900/20 hover:text-red-300 transition"
                        >
                          Supprimer
                        </button>
                      )}
                      {deleteSetConfirmId === set.id && (
                        <div className="mr-3 flex items-center gap-1">
                          <span className="text-xs text-white/40">Confirmer ?</span>
                          <button
                            onClick={() => deleteSet(set.id)}
                            className="rounded-lg bg-red-600/80 px-2 py-1 text-xs font-bold text-white hover:bg-red-500"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setDeleteSetConfirmId(null)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/40 hover:text-white"
                          >
                            Non
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contenu accordéon */}
                    {isOpen && (
                      <div className="border-t border-white/10 px-5 pb-5 pt-4">
                        {loadingTracks === set.id ? (
                          <p className="text-sm text-white/40">Chargement...</p>
                        ) : (
                          <>
                            {/* Bouton Lancer */}
                            <button
                              onClick={() => openLaunch(set.id)}
                              className="mb-4 w-full rounded-xl py-3 text-sm font-black text-[#0a1628]"
                              style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
                            >
                              🎮 {isLaunching ? 'Fermer' : 'Lancer une session'}
                            </button>

                            {/* Panel lancement inline */}
                            {isLaunching && (
                              <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <p className="text-sm font-bold text-yellow-300">Équipes ({teamNames.length})</p>
                                  <button
                                    onClick={addTeam}
                                    className="text-xs font-bold text-yellow-300 hover:text-yellow-200"
                                  >
                                    + Ajouter
                                  </button>
                                </div>
                                <div className="mb-3 flex flex-col gap-2">
                                  {teamNames.map((name, i) => (
                                    <div key={i} className="flex gap-2">
                                      <input
                                        value={name}
                                        onChange={(e) => setTeamNames((p) => p.map((n, idx) => idx === i ? e.target.value : n))}
                                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                                      />
                                      {teamNames.length > 2 && (
                                        <button
                                          onClick={() => removeTeam(i)}
                                          className="px-2 text-white/30 hover:text-red-400"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={launchSession}
                                  disabled={launching}
                                  className="w-full rounded-xl py-3 font-black text-[#0a1628] disabled:opacity-50"
                                  style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
                                >
                                  {launching ? 'Démarrage...' : '▶ Démarrer'}
                                </button>
                              </div>
                            )}

                            {/* Liste pistes */}
                            <div className="mb-4 flex flex-col gap-2">
                              {tracks.length === 0 && (
                                <p className="text-sm text-white/30">Aucune piste — ajoutez-en via Deezer ci-dessous.</p>
                              )}
                              {tracks.map((t, i) => (
                                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                  <span className="w-5 shrink-0 text-center text-xs font-bold text-white/30">{i + 1}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                                    <p className="truncate text-xs text-white/50">{t.artist}</p>
                                  </div>
                                  {!set.isPublic && (
                                    <button onClick={() => deleteTrack(set.id, t.id)} className="shrink-0 text-white/20 hover:text-red-400">
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Recherche Deezer */}
                            {!set.isPublic && (
                              <div>
                                <button
                                  onClick={() => openSearch(set.id)}
                                  className="mb-3 text-xs font-bold text-yellow-400/70 hover:text-yellow-300"
                                >
                                  {isSearching ? '▲ Masquer la recherche' : '+ Ajouter des pistes via Deezer'}
                                </button>

                                {isSearching && (
                                  <div>
                                    <input
                                      value={query}
                                      onChange={(e) => handleSearch(e.target.value)}
                                      placeholder="Rechercher un titre, artiste..."
                                      className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-yellow-400/50 focus:outline-none"
                                    />
                                    {searching && <p className="mb-2 text-xs text-white/40">Recherche...</p>}
                                    <div className="flex flex-col gap-2">
                                      {results.map((r) => (
                                        <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                          <button onClick={() => previewTrack(r.previewUrl, r.id)} className="shrink-0 text-base">
                                            {playingId === r.id ? '⏸' : '▶'}
                                          </button>
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                                            <p className="truncate text-xs text-white/50">{r.artist}</p>
                                          </div>
                                          <button
                                            onClick={() => addFromDeezer(r)}
                                            className="shrink-0 rounded-lg bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300 hover:bg-yellow-400/30"
                                          >
                                            +
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── SESSIONS TAB ── */}
        {tab === 'sessions' && (
          <div className="flex flex-col gap-3">
            {deleteSessionError && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {deleteSessionError}
              </p>
            )}
            {sessions.length === 0 && (
              <p className="text-center text-sm text-white/30">Aucune session en cours.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{s.gameSetName}</p>
                    <p className="text-xs text-white/40">
                      {s.status === 'WAITING' ? '⏳ En attente' : '🎵 En cours'}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSession(s.id)}
                    disabled={deletingSessionId === s.id}
                    className="rounded-lg border border-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400/60 hover:bg-red-900/20 hover:text-red-300 disabled:opacity-40 transition"
                  >
                    {deletingSessionId === s.id ? '...' : 'Supprimer'}
                  </button>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {s.teams.map((t) => (
                    <span key={t.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                      {t.name} · {t.score} pts
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/blind-test/${s.token}/control`)}
                    className="flex-1 rounded-xl py-2 text-sm font-bold text-[#0a1628]"
                    style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
                  >
                    📱 Reprendre contrôle
                  </button>
                  <button
                    onClick={() => navigate(`/blind-test/${s.token}/display`)}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white"
                  >
                    📺 Affichage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
