import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setDone(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <p className="mb-3 text-4xl">📧</p>
          <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Email envoyé</h1>
          <p className="mb-6 text-sm text-gray-500">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
          </p>
          <Link to="/login" className="text-sm font-medium text-brand-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-gray-500">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-dark">
          <Link to="/login" className="font-medium text-brand-primary hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
