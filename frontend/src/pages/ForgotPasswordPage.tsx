import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const BG = 'radial-gradient(ellipse at 50% 0%, #1a0a3d 0%, #070B14 65%)'

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
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: BG }}>
        <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-white/5 p-8 text-center backdrop-blur-md">
          <p className="mb-3 text-4xl">📧</p>
          <h1 className="mb-2 text-xl font-bold text-white">Email envoyé</h1>
          <p className="mb-6 text-sm text-white/40">
            Si un compte existe pour <strong className="text-white/70">{email}</strong>, un lien de réinitialisation vient d'être envoyé.
          </p>
          <Link to="/login" className="text-sm font-semibold text-[#f4b942] hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: BG }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <p className="text-4xl font-black tracking-tight" style={{ color: '#f4b942' }}>
            Anim<span className="text-white">Box</span>
          </p>
          <p className="mt-1 text-sm text-white/30">La plateforme de jeux d'animation</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-8 backdrop-blur-md">
          <h1 className="mb-1 text-xl font-bold text-white">Mot de passe oublié</h1>
          <p className="mb-6 text-sm text-white/40">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold text-[#f4b942] hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
