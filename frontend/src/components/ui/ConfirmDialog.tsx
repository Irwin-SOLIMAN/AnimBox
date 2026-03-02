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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="mb-6 text-center text-brand-darkest">{message}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-red-500 hover:bg-red-600"
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
