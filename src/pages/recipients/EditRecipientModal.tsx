import { Button, Form, Modal } from 'react-bootstrap'

interface EditRecipientModalProps {
  show: boolean
  email: string
  name: string
  company: string
  onNameChange: (value: string) => void
  onCompanyChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

/**
 * Edit dialog for the two mutable per-recipient fields.
 *
 * The address is shown but not editable: it is the identity used to match the
 * row in the store, and every export and send keys off it.
 */
export function EditRecipientModal({
  show,
  email,
  name,
  company,
  onNameChange,
  onCompanyChange,
  onSave,
  onCancel,
}: EditRecipientModalProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit recipient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {show && (
          <Form onSubmit={(e) => { e.preventDefault(); onSave() }}>
            <div className="field">
              <Form.Label className="form-label-reachy" htmlFor="edit-email">Email</Form.Label>
              <Form.Control
                id="edit-email"
                type="email"
                value={email}
                disabled
                className="form-control-reachy"
              />
              <div className="form-hint-reachy">
                <i className="bi bi-info-circle"></i>
                <span>Email cannot be changed.</span>
              </div>
            </div>
            <div className="field">
              <Form.Label className="form-label-reachy" htmlFor="edit-name">Name</Form.Label>
              <Form.Control
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="form-control-reachy"
                placeholder="Jane Doe"
              />
            </div>
            <div className="field">
              <Form.Label className="form-label-reachy" htmlFor="edit-company">Company</Form.Label>
              <Form.Control
                id="edit-company"
                type="text"
                value={company}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="form-control-reachy"
                placeholder="Acme Inc."
              />
            </div>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" className="btn-reachy-outline" onClick={onCancel}>
          Cancel
        </Button>
        <button type="button" className="btn-submit-reachy w-auto py-2 px-4" onClick={onSave}>
          <i className="bi bi-check-lg"></i>
          Save changes
        </button>
      </Modal.Footer>
    </Modal>
  )
}
