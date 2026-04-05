import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { gameSessionService } from '../services/gameSessionService'

const FF_BG = 'radial-gradient(ellipse at 50% 30%, #1a3570 0%, #080f22 70%)'

const SessionLobbyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    gameSessionService.getById(Number(id)).then((s) => setToken(s.token))
  }, [id])

  const controlUrl = token
    ? `${window.location.origin}/game-sessions/${token}/control`
    : ''
  const displayPath = token ? `/game-sessions/${token}/display` : ''

  const copyUrl = () => {
    if (!controlUrl) return
    navigator.clipboard.writeText(controlUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: FF_BG }}
    >
      {/* Titre */}
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-ff-gold/70">Une</p>
        <h1
          className="text-5xl font-black uppercase tracking-wider text-ff-gold"
          style={{ textShadow: '0 0 24px rgba(244,185,66,0.55), 0 2px 0 rgba(0,0,0,0.5)' }}
        >
          Famille en Or
        </h1>
        <p className="mt-3 text-lg font-bold text-white">Partie prête !</p>
        <p className="mt-1 text-sm text-white/40">
          Scanne le QR code pour contrôler la partie depuis ton téléphone.
        </p>
      </div>

      {/* QR code */}
      <div
        className="mb-6 rounded-2xl border-2 border-ff-gold p-5 ff-glow"
        style={{ background: 'linear-gradient(135deg, #101e42, #162550)' }}
      >
        {controlUrl ? (
          <QRCodeSVG
            value={controlUrl}
            size={200}
            bgColor="transparent"
            fgColor="#f4b942"
          />
        ) : (
          <div className="flex h-50 w-50 items-center justify-center">
            <p className="text-ff-gold/50 animate-pulse text-sm">Chargement...</p>
          </div>
        )}
      </div>

      {/* URL */}
      <div className="mb-8 flex w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-ff-card px-4 py-3">
        <span className="flex-1 truncate text-left text-sm text-white/40">{controlUrl || '...'}</span>
        <button
          onClick={copyUrl}
          disabled={!controlUrl}
          className="shrink-0 text-sm font-bold text-ff-gold transition hover:text-ff-gold-light disabled:opacity-30"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>

      {/* Bouton lancer affichage */}
      <button
        onClick={() => displayPath && navigate(displayPath)}
        disabled={!displayPath}
        className="w-full max-w-sm rounded-2xl py-4 text-base font-black uppercase tracking-wide text-[#0a1628] transition active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(180deg, #fdd876 0%, #f4b942 50%, #c4922e 100%)' }}
      >
        Lancer l'affichage public →
      </button>
    </div>
  )
}

export default SessionLobbyPage
