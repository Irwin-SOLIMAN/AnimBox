import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { validatePassword, validateConfirm } from '../utils/validation'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({ password: '', confirm: '' })
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    const next = {
      password: validatePassword(password) ?? '',
      confirm: validateConfirm(password, confirm) ?? '',
    }
    setErrors(next)
    return !next.password && !next.confirm
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg ?? 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <p className="mb-3 text-4xl">❌</p>
          <p className="text-red-500">Lien invalide.</p>
          <Link to="/login" className="mt-4 block text-sm font-medium text-brand-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <p className="mb-3 text-4xl">✅</p>
          <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Mot de passe mis à jour !</h1>
          <p className="text-sm text-gray-500">Redirection vers la connexion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Nouveau mot de passe</h1>
        <p className="mb-6 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              label="Nouveau mot de passe"
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
                  <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
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

          {apiError && <p className="text-sm text-red-500">{apiError}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
