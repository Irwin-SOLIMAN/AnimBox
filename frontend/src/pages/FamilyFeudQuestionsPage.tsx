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
          <h1 className="text-3xl font-bold text-white">Une Famille en Or — Questions</h1>
        </div>
        {!formOpen && (
          <Button onClick={openCreate}>+ Nouvelle question</Button>
        )}
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-brand-primary px-4 py-3 text-white">{successMsg}</div>
      )}

      {/* Formulaire create / edit */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl bg-white p-6 shadow-md"
        >
          <h2 className="mb-4 text-lg font-bold text-brand-darkest">
            {editingId ? 'Modifier la question' : 'Nouvelle question'}
          </h2>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
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
          <p className="mb-2 text-sm font-medium text-brand-darkest">
            Réponses ({formAnswers.length}/{MAX_ANSWERS}) — classées du plus au moins fréquent
          </p>
          <div className="mb-3 flex flex-col gap-2">
            {formAnswers.map((answer, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm font-bold text-brand-primary">
                  {i + 1}
                </span>
                <input
                  type="text"
                  placeholder="Réponse"
                  value={answer.text}
                  onChange={(e) => updateAnswer(i, 'text', e.target.value)}
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <input
                  type="number"
                  placeholder="Points"
                  value={answer.score}
                  onChange={(e) => updateAnswer(i, 'score', e.target.value)}
                  required
                  min={1}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => removeAnswer(i)}
                  disabled={formAnswers.length <= MIN_ANSWERS}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30"
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
              className="mb-4 text-sm text-brand-primary hover:underline"
            >
              + Ajouter une réponse
            </button>
          )}

          {formError && <p className="mb-3 text-sm text-red-500">{formError}</p>}

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
      {loading && <p className="text-brand-light">Chargement...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && questions.length === 0 && (
        <p className="text-brand-light opacity-60">
          Aucune question pour l'instant. Crée-en une !
        </p>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow-md">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-darkest">{q.text}</p>
                {q.category && (
                  <span className="mt-1 inline-block rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
                    {q.category}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => openEdit(q)}>
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                  onClick={() => setDeleteId(q.id)}
                >
                  Supprimer
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {q.answers.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1 rounded-lg bg-brand-light px-3 py-1 text-sm"
                >
                  <span className="font-medium text-brand-darkest">{a.rank}.</span>
                  <span className="text-brand-darkest">{a.text}</span>
                  <span className="ml-1 font-bold text-brand-primary">{a.score}pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
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
