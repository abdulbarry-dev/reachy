import { Modal, Button } from 'react-bootstrap'

interface ConfirmModalProps {
  show: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: string
  icon?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmModal({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  icon = 'bi-exclamation-triangle-fill',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Body className="text-center py-4">
        <div
          className={`confirm-modal-icon d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${
            confirmVariant === 'danger' ? 'confirm-modal-icon-danger' : 'confirm-modal-icon-primary'
          }`}
        >
          <i className={`bi ${icon} confirm-modal-icon-glyph`} />
        </div>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted small mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 justify-content-center pb-4 gap-2">
        <Button variant="outline-secondary" className="rounded-pill px-4" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          className={`rounded-pill px-4 ${confirmVariant === 'danger' ? '' : 'btn-gradient'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
