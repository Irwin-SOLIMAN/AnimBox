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

interface SelectedQuestion {
  id: number
  text: string
  category: string | null
}

const GameSetsPage = () => {
  const navigate = useNavigate()

  // --- Données ---
  const [gameSets, setGameSets] = useState<GameSetResponse[]>([])
  const [activeSessions, setActiveSessions] = useState<GameSessionResponse[]>([])
  const [allQuestions, setAllQuestions] = useState<FamilyFeudQuestionResponse[]>([])
  const [gameTypeId, setGameTypeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [stopLoadingId, setStopLoadingId] = useState<number | null>(null)

  // --- Formulaire create/edit ---
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [questionFilter, setQuestionFilter] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // --- Drag & drop ---
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // --- Suppression ---
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // --- Lancement ---
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

  useEffect(() => {
    fetchData()
  }, [])

  // --- Formulaire ---
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

  // Questions disponibles = banque filtrée - déjà sélectionnées
  const availableQuestions = allQuestions.filter(
    (q) =>
      !selectedQuestions.some((s) => s.id === q.id) &&
      (q.text.toLowerCase().includes(questionFilter.toLowerCase()) ||
        (q.category ?? '').toLowerCase().includes(questionFilter.toLowerCase())),
  )

  const addQuestion = (q: FamilyFeudQuestionResponse) => {
    setSelectedQuestions((prev) => [...prev, { id: q.id, text: q.text, category: q.category }])
  }

  const removeQuestion = (id: number) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  // --- Drag & drop ---
  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const newList = [...selectedQuestions]
    const [moved] = newList.splice(dragIndex, 1)
    newList.splice(dropIndex, 0, moved)
    setSelectedQuestions(newList)
    setDragIndex(null)
  }

  // --- Submit ---
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError('Le nom est requis')
      return
    }
    if (selectedQuestions.length === 0) {
      setFormError('Sélectionne au moins une question')
      return
    }
    if (gameTypeId === null) {
      setFormError('Type de jeu introuvable')
      return
    }

    setFormLoading(true)
    try {
      const payload = {
        name: formName.trim(),
        gameTypeId,
        questionIds: selectedQuestions.map((q) => q.id),
      }
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

  // --- Suppression ---
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

  // --- Lancement ---
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
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/games')}
            className="mb-1 text-sm text-brand-primary hover:underline"
          >
            ← Mes jeux
          </button>
          <h1 className="text-3xl font-bold text-white">Une Famille en Or — Parties</h1>
        </div>
        {!formOpen && <Button onClick={openCreate}>+ Nouveau set</Button>}
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-brand-primary px-4 py-3 text-white">{successMsg}</div>
      )}

      {/* Sessions en cours */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Sessions en cours</h2>
          <div className="flex flex-col gap-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4">
                <div>
                  <p className="font-semibold text-white">{session.gameSet.name}</p>
                  <p className="text-sm text-white/60">
                    {session.teamAName} {session.teamAScore} — {session.teamBScore} {session.teamBName}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      session.status === 'IN_PROGRESS'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {session.status === 'IN_PROGRESS' ? 'En cours' : 'En attente'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="px-3 py-1 text-sm"
                    onClick={() => navigate(`/game-sessions/${session.token}/control`)}
                  >
                    Rejoindre
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/10"
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
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-bold text-brand-darkest">
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
              <p className="mb-2 text-sm font-medium text-brand-darkest">
                Banque de questions ({availableQuestions.length} disponibles)
              </p>
              <input
                type="text"
                placeholder="Filtrer..."
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {availableQuestions.length === 0 && (
                  <p className="p-2 text-sm text-gray-400">Aucune question disponible</p>
                )}
                {availableQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => addQuestion(q)}
                    className="flex items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-brand-light"
                  >
                    <span className="mt-0.5 shrink-0 text-brand-primary">+</span>
                    <span>
                      <span className="font-medium text-brand-darkest">{q.text}</span>
                      {q.category && (
                        <span className="ml-2 text-xs text-gray-400">{q.category}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Questions sélectionnées + drag & drop */}
            <div>
              <p className="mb-2 text-sm font-medium text-brand-darkest">
                Questions du set ({selectedQuestions.length} sélectionnées)
              </p>
              <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {selectedQuestions.length === 0 && (
                  <p className="p-2 text-sm text-gray-400">Aucune question sélectionnée</p>
                )}
                {selectedQuestions.map((q, i) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm transition-opacity ${
                      dragIndex === i
                        ? 'border-brand-primary bg-brand-light opacity-50'
                        : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <span className="shrink-0 text-gray-400">⠿</span>
                    <span className="flex-1 text-brand-darkest">{q.text}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {formError && <p className="mt-4 text-sm text-red-500">{formError}</p>}

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

      {/* Liste */}
      {loading && <p className="text-brand-light">Chargement...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && gameSets.length === 0 && (
        <p className="text-brand-light opacity-60">Aucun set pour l'instant. Crée-en un !</p>
      )}

      <div className="flex flex-col gap-4">
        {gameSets.map((gs) => (
          <div key={gs.id} className="rounded-2xl bg-white p-5 shadow-md">
            {/* Formulaire de lancement inline */}
            {launchSetId === gs.id ? (
              <form onSubmit={handleLaunch} className="flex flex-col gap-4">
                <p className="font-bold text-brand-darkest">Lancer : {gs.name}</p>
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
                {launchError && <p className="text-sm text-red-500">{launchError}</p>}
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
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-brand-darkest">{gs.name}</p>
                    <p className="text-sm text-gray-500">
                      {gs.questions.length} question{gs.questions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                      onClick={() => openEdit(gs)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                      onClick={() => setDeleteId(gs.id)}
                    >
                      Supprimer
                    </Button>
                    <Button className="px-3 py-1 text-sm" onClick={() => openLaunch(gs.id)}>
                      Lancer la partie
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {gs.questions.map((q, i) => (
                    <span
                      key={q.id}
                      className="rounded-lg bg-brand-light px-3 py-1 text-sm text-brand-darkest"
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
