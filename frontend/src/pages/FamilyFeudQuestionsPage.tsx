import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { familyFeudService } from '../services/familyFeudService'
import type { FamilyFeudQuestionResponse } from '../types/familyFeud'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ConfirmDialog from '../components/ui/ConfirmDialog'

interface AnswerField {
  text: string
  score: string
}

const EMPTY_ANSWER: AnswerField = { text: '', score: '' }
const MIN_ANSWERS = 2
const MAX_ANSWERS = 8

const FamilyFeudQuestionsPage = () => {
  const navigate = useNavigate()

  // --- Données ---
  const [questions, setQuestions] = useState<FamilyFeudQuestionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // --- Formulaire ---
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formText, setFormText] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formAnswers, setFormAnswers] = useState<AnswerField[]>([EMPTY_ANSWER, EMPTY_ANSWER])
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // --- Suppression ---
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchQuestions = () => {
    setLoading(true)
    familyFeudService
      .findAll()
      .then(setQuestions)
      .catch(() => setError('Impossible de charger les questions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  // --- Gestion du formulaire ---
  const openCreate = () => {
    setEditingId(null)
    setFormText('')
    setFormCategory('')
    setFormAnswers([EMPTY_ANSWER, EMPTY_ANSWER])
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (q: FamilyFeudQuestionResponse) => {
    setEditingId(q.id)
    setFormText(q.text)
    setFormCategory(q.category ?? '')
    setFormAnswers(
      [...q.answers]
        .sort((a, b) => a.rank - b.rank)
        .map((a) => ({ text: a.text, score: String(a.score) })),
    )
    setFormError('')
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setFormError('')
  }

  const updateAnswer = (index: number, field: keyof AnswerField, value: string) => {
    setFormAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  const addAnswer = () => {
    if (formAnswers.length < MAX_ANSWERS) {
      setFormAnswers((prev) => [...prev, EMPTY_ANSWER])
    }
  }

  const removeAnswer = (index: number) => {
    if (formAnswers.length > MIN_ANSWERS) {
      setFormAnswers((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')

    const answers = formAnswers.map((a, i) => ({
      text: a.text.trim(),
      rank: i + 1,
      score: Number(a.score),
    }))

    if (answers.some((a) => !a.text)) {
      setFormError('Toutes les réponses doivent avoir un texte')
      return
    }
    if (answers.some((a) => isNaN(a.score) || a.score <= 0)) {
      setFormError('Tous les scores doivent être des nombres positifs')
      return
    }

    setFormLoading(true)
    try {
      const payload = { text: formText.trim(), category: formCategory.trim(), answers }
      if (editingId !== null) {
        await familyFeudService.update(editingId, payload)
      } else {
        await familyFeudService.create(payload)
      }
      closeForm()
      fetchQuestions()
      showSuccess(editingId ? 'Question modifiée' : 'Question créée')
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
      await familyFeudService.delete(deleteId)
      setQuestions((prev) => prev.filter((q) => q.id !== deleteId))
      showSuccess('Question supprimée')
    } catch {
      setError('Erreur lors de la suppression')
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f1a3d 0%, #070B14 70%)' }}>
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
          <p className="text-sm text-white/30">Banque de questions</p>
        </div>
        {!formOpen && (
          <Button onClick={openCreate} className="shrink-0">+ Nouvelle question</Button>
        )}
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
          {successMsg}
        </div>
      )}

      {/* Formulaire create / edit */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-white/8 bg-white/5 p-6"
        >
          <h2 className="mb-5 text-lg font-black text-white">
            {editingId ? 'Modifier la question' : 'Nouvelle question'}
          </h2>

          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Question"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              required
            />
            <Input
              label="Catégorie (optionnel)"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
            />
          </div>

          {/* Réponses */}
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/30">
            Réponses ({formAnswers.length}/{MAX_ANSWERS}) — du plus au moins fréquent
          </p>
          <div className="mb-3 flex flex-col gap-2">
            {formAnswers.map((answer, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-[#f4b942]">
                  {i + 1}
                </span>
                <input
                  type="text"
                  placeholder="Réponse"
                  value={answer.text}
                  onChange={(e) => updateAnswer(i, 'text', e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#f4b942]/50"
                />
                <input
                  type="number"
                  placeholder="Pts"
                  value={answer.score}
                  onChange={(e) => updateAnswer(i, 'score', e.target.value)}
                  required
                  min={1}
                  className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#f4b942]/50"
                />
                <button
                  type="button"
                  onClick={() => removeAnswer(i)}
                  disabled={formAnswers.length <= MIN_ANSWERS}
                  className="text-white/20 hover:text-red-400 transition disabled:opacity-20"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {formAnswers.length < MAX_ANSWERS && (
            <button
              type="button"
              onClick={addAnswer}
              className="mb-5 text-sm text-[#f4b942]/60 hover:text-[#f4b942] transition"
            >
              + Ajouter une réponse
            </button>
          )}

          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Annuler
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      )}

      {/* Liste des questions */}
      {loading && <p className="text-white/30">Chargement...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-white/20">Aucune question pour l'instant.</p>
          <button onClick={openCreate} className="mt-2 text-sm text-[#f4b942] hover:underline">
            Créer la première question →
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-white">{q.text}</p>
                {q.category && (
                  <span className="mt-1.5 inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
                    {q.category}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(q)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 transition"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteId(q.id)}
                  className="rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400/60 hover:bg-red-900/20 transition"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {q.answers.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-3 py-1 text-sm"
                >
                  <span className="font-bold text-[#f4b942]">{a.rank}.</span>
                  <span className="text-white/70">{a.text}</span>
                  <span className="ml-1 text-xs text-white/30">{a.score}pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        message="Supprimer cette question et toutes ses réponses ?"
        confirmLabel={deleteLoading ? 'Suppression...' : 'Supprimer'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default FamilyFeudQuestionsPage
