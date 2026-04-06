import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { validateEmail, validatePassword, validateConfirm } from '../utils/validation'

const BG = 'radial-gradient(ellipse at 50% 0%, #1a0a3d 0%, #070B14 65%)'

const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' })
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    const next = {
      email: validateEmail(email) ?? '',
      password: validatePassword(password) ?? '',
      confirm: validateConfirm(password, confirm) ?? '',
    }
    setErrors(next)
    return !next.email && !next.password && !next.confirm
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      await authService.register(email, password)
      setDone(true)
    } catch {
      setApiError('Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: BG }}>
        <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-white/5 p-8 text-center backdrop-blur-md">
          <p className="mb-3 text-4xl">📧</p>
          <h1 className="mb-2 text-xl font-bold text-white">Vérifiez votre email</h1>
          <p className="mb-6 text-sm text-white/40">
            Un lien de vérification a été envoyé à <strong className="text-white/70">{email}</strong>.<br />
            Cliquez dessus pour activer votre compte.
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
          <h1 className="mb-6 text-xl font-bold text-white">Créer un compte</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <div>
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              {password.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {[
                    { ok: password.length >= 8, label: '8 caractères minimum' },
                    { ok: /[A-Z]/.test(password), label: 'Une majuscule' },
                    { ok: /[a-z]/.test(password), label: 'Une minuscule' },
                    { ok: /[0-9]/.test(password), label: 'Un chiffre' },
                    { ok: /[^A-Za-z0-9]/.test(password), label: 'Un caractère spécial (!@#$...)' },
                  ].map(({ ok, label }) => (
                    <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-400' : 'text-white/30'}`}>
                      <span>{ok ? '✓' : '○'}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />

            {apiError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {apiError}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              {loading ? 'Création...' : "S'inscrire"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/30">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-[#f4b942] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
