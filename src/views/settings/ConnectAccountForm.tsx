import { useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { invokeEdgeFunction } from '../../lib/edge-functions'

interface ConnectAccountFormProps {
  /** Called after the SMTP check succeeds, once the fields are cleared. */
  onConnected: () => void
}

const DEFAULT_HOST = 'smtp.gmail.com'
const STARTTLS_PORT = 587
const SSL_PORT = 465

/**
 * Gmail app-password form.
 *
 * All eight pieces of state belong to this form alone; the page only needs to
 * hear that a connection was added. Keeping the submit here also keeps the
 * failure message next to the fields that caused it.
 */
export function ConnectAccountForm({ onConnected }: ConnectAccountFormProps) {
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState(DEFAULT_HOST)
  const [smtpPort, setSmtpPort] = useState(STARTTLS_PORT)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const isSecure = smtpPort === SSL_PORT

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setConnectError(null)

    try {
      await invokeEdgeFunction(
        'connect-email-account',
        { fromName, fromEmail, appPassword, smtpHost, smtpPort },
        'Connection failed',
      )

      setFromName('')
      setFromEmail('')
      setAppPassword('')
      setSmtpHost(DEFAULT_HOST)
      setSmtpPort(STARTTLS_PORT)
      onConnected()
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Col lg={7}>
      <div>
        <Card className="card-reachy border-0">
          <Card.Body className="p-4">
            <SectionHeader
              icon="bi-envelope-plus"
              title="Connect Gmail account"
              description="Add a new sender identity"
              className="mb-4"
            />

            <Form onSubmit={handleSubmit}>
              {/* Sender identity */}
              <Row className="g-3">
                <Col md={6}>
                  <div className="field">
                    <Form.Label className="form-label-reachy" htmlFor="settings-name">Your name</Form.Label>
                    <Form.Control
                      id="settings-name"
                      type="text"
                      placeholder="Jane Doe"
                      className="form-control-reachy"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      required
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="field">
                    <Form.Label className="form-label-reachy" htmlFor="settings-email">Gmail address</Form.Label>
                    <Form.Control
                      id="settings-email"
                      type="email"
                      placeholder="you@gmail.com"
                      className="form-control-reachy"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      required
                    />
                  </div>
                </Col>
              </Row>

              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="settings-password">Gmail App Password</Form.Label>
                <Form.Control
                  id="settings-password"
                  type="password"
                  placeholder="•••• •••• •••• ••••"
                  className="form-control-reachy"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  required
                />
                <div className="form-hint-reachy">
                  <i className="bi bi-info-circle"></i>
                  <span>
                    Generate in your{' '}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="fw-semibold text-decoration-none link-reachy">
                      Google Account settings
                    </a>
                    . Requires 2FA enabled.
                  </span>
                </div>
              </div>

              {/* SMTP connection settings — grouped */}
              <div className="field-group">
                <div className="field-group-label">
                  <i className="bi bi-hdd-network"></i>
                  SMTP Connection
                </div>
                <Row className="g-3 align-items-stretch">
                  <Col xs={12} sm={7}>
                    <div className="field mb-0">
                      <Form.Label className="form-label-reachy" htmlFor="settings-host">Host</Form.Label>
                      <Form.Control
                        id="settings-host"
                        type="text"
                        className="form-control-reachy"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col xs={12} sm={5}>
                    <div className="field mb-0">
                      <Form.Label className="form-label-reachy" htmlFor="settings-port">Port</Form.Label>
                      <Form.Control
                        id="settings-port"
                        type="number"
                        min={1}
                        max={65535}
                        className="form-control-reachy"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Math.max(1, Math.min(65535, Math.round(Number(e.target.value)))))}
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="toggle-field">
                      <label htmlFor="secure-switch" className="toggle-field-copy">
                        <span className="toggle-field-label">Encryption</span>
                        <span className="toggle-field-hint">
                          {isSecure ? 'SSL — implicit TLS on port 465' : 'TLS — STARTTLS on port 587'}
                        </span>
                      </label>
                      <Form.Check
                        type="switch"
                        id="secure-switch"
                        checked={isSecure}
                        onChange={(e) => setSmtpPort(e.target.checked ? SSL_PORT : STARTTLS_PORT)}
                        aria-label="Use SSL with port 465 instead of STARTTLS with port 587"
                        className="toggle-field-switch"
                      />
                    </div>
                  </Col>
                </Row>
              </div>

              {connectError && (
                <div className="form-error-reachy">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{connectError}</span>
                </div>
              )}

              <button type="submit" className="btn-submit-reachy" disabled={connecting}>
                {connecting ? (
                  <><span className="spinner-border spinner-border-sm" />Testing connection...</>
                ) : (
                  <><i className="bi bi-plug"></i>Test &amp; Connect</>
                )}
              </button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Col>
  )
}
