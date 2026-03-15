import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/authStore'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('Lien invalide.')
      return
    }

    authService
      .verifyEmail(token)
      .then(({ accessToken, refreshToken }) => {
        // Récupère l'email depuis le JWT (payload base64)
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        login({ email: payload.sub }, accessToken, refreshToken)
        setStatus('success')
        setTimeout(() => navigate('/games'), 2000)
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message ?? 'Lien de vérification invalide ou expiré.')
        setStatus('error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        {status === 'loading' && (
          <>
            <p className="mb-3 text-4xl animate-spin">⏳</p>
            <p className="text-gray-500">Vérification en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <p className="mb-3 text-4xl">✅</p>
            <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Email vérifié !</h1>
            <p className="text-sm text-gray-500">Redirection vers votre espace...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="mb-3 text-4xl">❌</p>
            <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Échec de la vérification</h1>
            <p className="mb-6 text-sm text-red-500">{errorMsg}</p>
            <Link to="/login" className="text-sm font-medium text-brand-primary hover:underline">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
