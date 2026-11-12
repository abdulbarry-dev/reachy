import { useState } from 'react'
import { Card, Col, Form } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import type { ImportedRecipient } from '../../types'

interface AddRecipientCardProps {
  onAdd: (recipient: Omit<ImportedRecipient, 'id'>) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Right column of the import row: the one-at-a-time form.
 *
 * The three fields and their validation error are only ever read by this
 * form, so they live here rather than being lifted into the page and passed
 * back down as nine props.
 */
export function AddRecipientCard({ onAdd }: AddRecipientCardProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) {
      setEmailError('Enter a valid email address, e.g. contact@company.com')
      return
    }

    onAdd({ email: normalized, name: name.trim() || undefined, company: company.trim() || undefined })
    setEmailError('')
    setEmail('')
    setName('')
    setCompany('')
  }

  return (
    <Col lg={5} className="min-w-0">
      <div className="h-100 min-w-0">
        <Card className="card-reachy border-0 h-100">
          <Card.Body className="p-4 d-flex flex-column">
            <SectionHeader
              icon="bi-person-plus"
              title="Add manually"
              description="One recipient at a time"
              className="mb-4"
            />
            <Form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column">
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="recip-email">Email address</Form.Label>
                <Form.Control
                  id="recip-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="contact@company.com"
                  className="form-control-reachy"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                  aria-invalid={emailError !== ''}
                  aria-describedby={emailError ? 'recip-email-error' : undefined}
                  required
                />
                {emailError && (
                  <div id="recip-email-error" className="form-error-reachy mt-2 mb-0" role="alert">
                    <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
                    <span>{emailError}</span>
                  </div>
                )}
              </div>
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="recip-name">Name</Form.Label>
                <Form.Control
                  id="recip-name"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="form-control-reachy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="recip-company">Company</Form.Label>
                <Form.Control
                  id="recip-company"
                  type="text"
                  inputMode="text"
                  autoComplete="organization"
                  placeholder="Acme Inc."
                  className="form-control-reachy"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-submit-reachy mt-auto">
                <i className="bi bi-plus-lg"></i>
                Add recipient
              </button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Col>
  )
}
