import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../components/ui/Button'

const SessionLobbyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const controlUrl = `${window.location.origin}/game-sessions/${id}/control`
  const displayUrl = `/game-sessions/${id}/display`

  const copyUrl = () => {
    navigator.clipboard.writeText(controlUrl)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-2 text-2xl font-bold text-brand-darkest">Partie prête !</h1>
        <p className="mb-8 text-sm text-gray-500">
          Scanne le QR code sur ton téléphone pour contrôler la partie.
        </p>

        {/* QR code */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-xl border-4 border-brand-primary p-4">
            <QRCodeSVG value={controlUrl} size={200} />
          </div>
        </div>

        {/* URL en texte */}
        <div className="mb-8 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3">
          <span className="flex-1 truncate text-left text-sm text-gray-600">{controlUrl}</span>
          <button onClick={copyUrl} className="shrink-0 text-sm text-brand-primary hover:underline">
            Copier
          </button>
        </div>

        {/* Lancer l'affichage public */}
        <Button className="w-full py-4 text-lg" onClick={() => navigate(displayUrl)}>
          Lancer l'affichage public →
        </Button>
      </div>
    </div>
  )
}

export default SessionLobbyPage
