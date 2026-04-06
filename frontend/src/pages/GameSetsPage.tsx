import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameSetService } from '../services/gameSetService'
import { gameSessionService } from '../services/gameSessionService'
import { familyFeudService } from '../services/familyFeudService'
import { gameTypeService } from '../services/gameTypeService'
import type { GameSetResponse } from '../types/gameSet'
import type { GameSessionResponse } from '../types/gameSession'
import type { FamilyFeudQuestionResponse } from '../types/familyFeud'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const BG = 'radial-gradient(ellipse at 50% 0%, #0f1a3d 0%, #070B14 70%)'

interface SelectedQuestion {
  id: number
  text: string
  category: string | null
}

const GameSetsPage = () => {
  const navigate = useNavigate()

  const [gameSets, setGameSets] = useState<GameSetResponse[]>([])
  const [activeSessions, setActiveSessions] = useState<GameSessionResponse[]>([])
  const [allQuestions, setAllQuestions] = useState<FamilyFeudQuestionResponse[]>([])
  const [gameTypeId, setGameTypeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [stopLoadingId, setStopLoadingId] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [questionFilter, setQuestionFilter] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [launchSetId, setLaunchSetId] = useState<number | null>(null)
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [launchLoading, setLaunchLoading] = useState(false)
  const [launchError, setLaunchError] = useState('')

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      gameSetService.findAll(),
      familyFeudService.findAll(),
      gameTypeService.findAll(),
      gameSessionService.findAll(),
    ])
      .then(([sets, questions, gameTypes, sessions]) => {
        setGameSets(sets)
        setAllQuestions(questions)
        const familyFeud = gameTypes.find((gt) => gt.code === 'FAMILY_FEUD')
        setGameTypeId(familyFeud?.id ?? null)
        setActiveSessions(sessions.filter((s) => s.status !== 'FINISHED'))
      })
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false))
  }

  const handleStopSession = async (id: number) => {
    setStopLoadingId(id)
    try {
      await gameSessionService.finish(id)
      setActiveSessions((prev) => prev.filter((s) => s.id !== id))
      showSuccess('Partie arrêtée')
    } catch {
      setError("Impossible d'arrêter la session")
    } finally {
      setStopLoadingId(null)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormName('')
    setSelectedQuestions([])
    setQuestionFilter('')
    setFormError('')
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (gs: GameSetResponse) => {
    setEditingId(gs.id)
    setFormName(gs.name)
    setSelectedQuestions(gs.questions.map((q) => ({ id: q.id, text: q.text, category: q.category })))
    setQuestionFilter('')
    setFormError('')
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setFormError('')
  }

  const availableQuestions = allQuestions.filter(
    (q) =>
      !selectedQuestions.some((s) => s.id === q.id) &&
      (q.text.toLowerCase().includes(questionFilter.toLowerCase()) ||
        (q.category ?? '').toLowerCase().includes(questionFilter.toLowerCase())),
  )

  const addQuestion = (q: FamilyFeudQuestionResponse) =>
    setSelectedQuestions((prev) => [...prev, { id: q.id, text: q.text, category: q.category }])

  const removeQuestion = (id: number) =>
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== id))

  const handleDragStart = (index: number) => {
    setDragIndex(index)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const newList = [...selectedQuestions]
    const [moved] = newList.splice(dragIndex, 1)
    newList.splice(dropIndex, 0, moved)
    setSelectedQuestions(newList)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // Regroupement par catégorie pour la banque de questions
  const categorizedAvailable = (() => {
    const groups: Record<string, typeof availableQuestions> = {}
    for (const q of availableQuestions) {
      const key = q.category?.trim() || 'Sans catégorie'
      if (!groups[key]) groups[key] = []
      groups[key].push(q)
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Sans catégorie') return 1
      if (b === 'Sans catégorie') return -1
      return a.localeCompare(b, 'fr')
    })
  })()

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    if (!formName.trim()) { setFormError('Le nom est requis'); return }
    if (selectedQuestions.length === 0) { setFormError('Sélectionne au moins une question'); return }
    if (gameTypeId === null) { setFormError('Type de jeu introuvable'); return }

    setFormLoading(true)
    try {
      const payload = { name: formName.trim(), gameTypeId, questionIds: selectedQuestions.map((q) => q.id) }
      if (editingId !== null) {
        await gameSetService.update(editingId, payload)
      } else {
        await gameSetService.create(payload)
      }
      closeForm()
      fetchData()
      showSuccess(editingId !== null ? 'Set modifié' : 'Set créé')
    } catch {
      setFormError("Une erreur s'est produite, réessaie")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    setDeleteLoading(true)
    try {
      await gameSetService.delete(deleteId)
      setGameSets((prev) => prev.filter((gs) => gs.id !== deleteId))
      showSuccess('Set supprimé')
    } catch {
      setError('Erreur lors de la suppression')
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  const openLaunch = (id: number) => {
    setLaunchSetId(id)
    setTeamAName('')
    setTeamBName('')
    setLaunchError('')
  }

  const closeLaunch = () => {
    setLaunchSetId(null)
    setLaunchError('')
  }

  const handleLaunch = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!launchSetId) return
    setLaunchLoading(true)
    try {
      const session = await gameSessionService.create({
        gameSetId: launchSetId,
        teamAName: teamAName.trim(),
        teamBName: teamBName.trim(),
      })
      navigate(`/game-sessions/${session.id}/lobby`)
    } catch {
      setLaunchError("Impossible de créer la session")
    } finally {
      setLaunchLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: BG }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/games')}
            className="mb-2 text-sm text-white/30 hover:text-[#f4b942] transition-colors"
          >
            ← Mes jeux
          </button>
          <h1 className="text-2xl font-black text-white">Une Famille en Or</h1>
          <p className="text-sm text-white/30">Gestion des sets de questions</p>
        </div>
        {!formOpen && (
          <Button onClick={openCreate} className="shrink-0">
            + Nouveau set
          </Button>
        )}
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
          {successMsg}
        </div>
      )}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Sessions en cours */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/30">Sessions en cours</h2>
          <div className="flex flex-col gap-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-white">{session.gameSet.name}</p>
                  <p className="text-sm text-white/40">
                    {session.teamAName} {session.teamAScore} — {session.teamBScore} {session.teamBName}
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      session.status === 'IN_PROGRESS'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}
                  >
                    {session.status === 'IN_PROGRESS' ? 'En cours' : 'En attente'}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    className="px-4 py-2 text-sm"
                    onClick={() => navigate(`/game-sessions/${session.token}/control`)}
                  >
                    Rejoindre
                  </Button>
                  <Button
                    variant="danger"
                    className="px-4 py-2 text-sm"
                    onClick={() => handleStopSession(session.id)}
                    loading={stopLoadingId === session.id}
                  >
                    Arrêter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire create/edit */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-white/8 bg-white/5 p-6"
        >
          <h2 className="mb-5 text-lg font-black text-white">
            {editingId !== null ? 'Modifier le set' : 'Nouveau set'}
          </h2>

          <div className="mb-6">
            <Input
              label="Nom du set"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Banque de questions */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">
                Banque ({availableQuestions.length} disponibles)
              </p>
              <input
                type="text"
                placeholder="Filtrer..."
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
                className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#f4b942]/50"
              />
              <div className="flex max-h-72 flex-col overflow-y-auto rounded-xl border border-white/8 bg-black/20 p-2">
                {availableQuestions.length === 0 && (
                  <p className="p-2 text-sm text-white/20">Aucune question disponible</p>
                )}
                {categorizedAvailable.map(([category, questions]) => (
                  <div key={category} className="mb-1">
                    <p className="sticky top-0 z-10 bg-black/40 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#f4b942]/50">
                      {category}
                    </p>
                    {questions.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => addQuestion(q)}
                        className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-white/5 transition"
                      >
                        <span className="mt-0.5 shrink-0 text-[#f4b942]/60">+</span>
                        <span className="font-medium text-white/70">{q.text}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Questions sélectionnées + drag & drop */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">
                Set ({selectedQuestions.length} sélectionnées)
              </p>
              <div
                className="flex max-h-80 flex-col overflow-y-auto rounded-xl border border-white/8 bg-black/20 p-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragOverIndex !== null && handleDrop(dragOverIndex)}
                onDragLeave={() => setDragOverIndex(null)}
              >
                {selectedQuestions.length === 0 && (
                  <p className="p-2 text-sm text-white/20">Aucune question sélectionnée</p>
                )}
                {selectedQuestions.map((q, i) => {
                  const isBeingDragged = dragIndex === i
                  const isDropTarget = dragOverIndex === i && dragIndex !== null && dragIndex !== i
                  const dropAbove = isDropTarget && dragIndex !== null && dragIndex > i
                  const dropBelow = isDropTarget && dragIndex !== null && dragIndex < i

                  return (
                    <div key={q.id} className="flex flex-col">
                      {/* Indicateur de dépôt AU-DESSUS */}
                      {dropAbove && (
                        <div className="mx-2 my-0.5 h-0.5 rounded-full bg-[#f4b942] shadow-[0_0_6px_rgba(244,185,66,0.6)]" />
                      )}
                      <div
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={handleDragEnd}
                        className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm transition-all select-none ${
                          isBeingDragged
                            ? 'border-[#f4b942]/30 bg-[#f4b942]/5 opacity-40 scale-95'
                            : isDropTarget
                              ? 'border-white/10 bg-white/5'
                              : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <span className="shrink-0 text-white/20 text-lg leading-none">⠿</span>
                        <span className="mr-1 shrink-0 text-xs font-bold text-white/20">{i + 1}.</span>
                        <span className="flex-1 text-white/70">{q.text}</span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="shrink-0 text-white/20 hover:text-red-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                      {/* Indicateur de dépôt EN-DESSOUS */}
                      {dropBelow && (
                        <div className="mx-2 my-0.5 h-0.5 rounded-full bg-[#f4b942] shadow-[0_0_6px_rgba(244,185,66,0.6)]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-sm text-red-400">{formError}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Annuler
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingId !== null ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      )}

      {/* Liste des sets */}
      {loading && <p className="text-white/30">Chargement...</p>}

      {!loading && gameSets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-white/20">Aucun set pour l'instant.</p>
          <button onClick={openCreate} className="mt-2 text-sm text-[#f4b942] hover:underline">
            Créer le premier set →
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {gameSets.map((gs) => (
          <div
            key={gs.id}
            className="rounded-2xl border border-white/8 bg-white/5 p-5"
          >
            {launchSetId === gs.id ? (
              <form onSubmit={handleLaunch} className="flex flex-col gap-4">
                <p className="text-sm font-bold text-white/60">
                  Lancer : <span className="text-white">{gs.name}</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Équipe A"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    required
                  />
                  <Input
                    label="Équipe B"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    required
                  />
                </div>
                {launchError && <p className="text-sm text-red-400">{launchError}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={closeLaunch}>
                    Annuler
                  </Button>
                  <Button type="submit" loading={launchLoading}>
                    Lancer la partie
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{gs.name}</p>
                    <p className="text-sm text-white/30">
                      {gs.questions.length} question{gs.questions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => openEdit(gs)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteId(gs.id)}
                      className="rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400/60 hover:bg-red-900/20 transition"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => openLaunch(gs.id)}
                      className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#070B14] transition active:scale-95"
                      style={{ background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)' }}
                    >
                      Lancer
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {gs.questions.map((q, i) => (
                    <span
                      key={q.id}
                      className="rounded-lg border border-white/8 bg-white/5 px-3 py-1 text-sm text-white/50"
                    >
                      {i + 1}. {q.text}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        message="Supprimer ce set de questions ?"
        confirmLabel={deleteLoading ? 'Suppression...' : 'Supprimer'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default GameSetsPage
