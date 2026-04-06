import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog = ({
  isOpen,
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0d1526] p-6 shadow-2xl">
        <p className="mb-6 text-center text-white/80">{message}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
