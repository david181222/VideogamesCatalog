import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Eliminar' }) {
  return (
    <Modal>
      <p className="text-text-primary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="md" className="text-sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" size="md" className="text-sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
