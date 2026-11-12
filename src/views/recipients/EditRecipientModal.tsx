import { useState, type FormEvent } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'

interface EditRecipientModalProps {
  show: boolean
  email: string
  initialName?: string
  initialCompany?: string
  onSave: (data: { name: string; company: string }) => void
  onCancel: () => void
}

function EditForm({
  email,
  initialName = '',
  initialCompany = '',
  onSave,
  onCancel,
}: {
  email: string
  initialName?: string
  initialCompany?: string
  onSave: (data: { name: string; company: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [company, setCompany] = useState(initialCompany)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ name, company })
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="field">
        <Form.Label className="form-label-reachy" htmlFor="edit-email">
          Email
        </Form.Label>
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
        <Form.Label className="form-label-reachy" htmlFor="edit-name">
          Name
        </Form.Label>
        <Form.Control
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-control-reachy"
          placeholder="Jane Doe"
        />
      </div>
      <div className="field">
        <Form.Label className="form-label-reachy" htmlFor="edit-company">
          Company
        </Form.Label>
        <Form.Control
          id="edit-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="form-control-reachy"
          placeholder="Acme Corp"
        />
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
        <Button variant="outline-secondary" className="btn-reachy-outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient">
          Save changes
        </Button>
      </div>
    </Form>
  )
}

/**
 * Edit dialog for the two mutable per-recipient fields.
 *
 * Encapsulates internal editing state in `EditForm` so typing does not trigger
 * re-renders on the main recipients list.
 */
export function EditRecipientModal({
  show,
  email,
  initialName,
  initialCompany,
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
          <EditForm
            key={email}
            email={email}
            initialName={initialName}
            initialCompany={initialCompany}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      </Modal.Body>
    </Modal>
  )
}
