import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { validateEmail, validatePassword, validateConfirm } from '../utils/validation'

const RegisterPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' })
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const { accessToken, refreshToken } = await authService.register(email, password)
      login({ email }, accessToken, refreshToken)
      navigate('/dashboard')
    } catch {
      setApiError('Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-brand-darkest">Créer un compte</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />

          {apiError && <p className="text-sm text-red-500">{apiError}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Création...' : "S'inscrire"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-dark">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-brand-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
