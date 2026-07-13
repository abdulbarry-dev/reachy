import { useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { AnimatedPage } from '../components/AnimatedPage'
import { useEmailAccounts } from '../hooks/useEmailAccounts'
import { useToast } from '../hooks/useToast'
import { ConfirmModal } from '../components/ConfirmModal'
import { supabase } from '../lib/supabase'
import { Skeleton } from '../components/Skeleton'
import { getEdgeFunctionUrl } from '../lib/edge-functions'
import type { EmailAccount } from '../types'

function AccountRow({ acc, onDelete }: { acc: EmailAccount; onDelete: (id: string) => void }) {
  const initials = acc.from_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div>
      <div className="account-item">
        <div className="d-flex align-items-center gap-3">
          <div className="account-avatar">{initials || '?'}</div>
          <div>
            <div className="fw-bold text-dark">{acc.from_name}</div>
            <div className="small text-muted">{acc.from_email}</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-muted border d-none d-md-inline" style={{ fontSize: '0.7rem' }}>
            {acc.smtp_host}:{acc.smtp_port}
          </span>
          <Button
            variant="outline-danger"
            size="sm"
            className="rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: 34, height: 34 }}
            onClick={() => onDelete(acc.id)}
            aria-label={`Delete ${acc.from_email} account`}
          >
            <i className="bi bi-trash" aria-hidden="true"></i>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Settings() {
  const { accounts, loading: accountsLoading, refetch, deleteAccount } = useEmailAccounts()
  const { toast } = useToast()

  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState(587)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const isSecure = smtpPort === 465

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setConnectError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(getEdgeFunctionUrl('connect-email-account'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fromName, fromEmail, appPassword, smtpHost, smtpPort }),
      })

      if (!res.ok) {
        let errMsg = 'Connection failed'
        try { const err = await res.json(); errMsg = err.error ?? errMsg } catch { /* use fallback */ }
        throw new Error(errMsg)
      }

      toast('Email account connected successfully', 'success')
      setFromName('')
      setFromEmail('')
      setAppPassword('')
      setSmtpHost('smtp.gmail.com')
      setSmtpPort(587)
      refetch()
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { ok, error } = await deleteAccount(deleteTarget)
    setDeleteTarget(null)
    if (ok) {
      toast('Email account removed', 'success')
    } else {
      toast(error ?? 'Failed to remove account', 'error')
    }
  }

  return (
    <AnimatedPage>
      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 mb-sm-5">
        <div>
          <h1 className="h2 mb-1 page-title">Settings</h1>
          <p className="text-muted mb-0">Connect and manage your Gmail sender accounts.</p>
        </div>
        {!accountsLoading && accounts.length > 0 && (
          <span className="count-badge d-inline-flex align-items-center gap-1.5">
            <i className="bi bi-envelope-fill"></i>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </span>
        )}
      </div>

      <div>
        <Row className="g-4">
          <Col lg={7}>
            <div>
              <Card className="card-reachy border-0">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="section-icon">
                      <i className="bi bi-envelope-plus"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Connect Gmail account</h5>
                      <p className="text-muted small mb-0">Add a new sender identity</p>
                    </div>
                  </div>

                  <Form onSubmit={handleConnect}>
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
                          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="fw-semibold text-decoration-none" style={{ color: 'var(--reachy-primary)' }}>
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
                          <div
                            className="toggle-field"
                            onClick={() => setSmtpPort(isSecure ? 587 : 465)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSmtpPort(isSecure ? 587 : 465) } }}
                          >
                            <div>
                              <div className="toggle-field-label">{isSecure ? 'SSL (Port 465)' : 'TLS (Port 587)'}</div>
                              <div className="toggle-field-hint">Click to switch encryption mode</div>
                            </div>
                            <Form.Check
                              type="switch"
                              id="secure-switch"
                              checked={isSecure}
                              onChange={(e) => setSmtpPort(e.target.checked ? 465 : 587)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}
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

          <Col lg={5}>
            <div className="h-100">
              <Card className="card-reachy border-0 h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="section-icon">
                      <i className="bi bi-list-nested"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Connected accounts</h5>
                      <p className="text-muted small mb-0">
                        {!accountsLoading && `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`}
                        {accountsLoading && 'Loading...'}
                      </p>
                    </div>
                  </div>

                  {accountsLoading ? (
                    <div>
                      {[0, 1].map((i) => (
                        <div key={i} className="account-item">
                          <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                            <Skeleton width={40} height={40} borderRadius={10} />
                            <div style={{ flex: 1 }}>
                              <Skeleton width="50%" height={16} borderRadius={6} />
                              <Skeleton width="80%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
                            </div>
                          </div>
                          <Skeleton width={34} height={34} borderRadius={17} />
                        </div>
                      ))}
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <i className="bi bi-inbox"></i>
                      </div>
                      <h6 className="empty-state-title">No accounts connected</h6>
                      <p className="empty-state-text">
                        Connect your first Gmail account to start sending campaigns.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {accounts.map((acc) => (
                        <AccountRow key={acc.id} acc={acc} onDelete={setDeleteTarget} />
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <ConfirmModal
        show={!!deleteTarget}
        title="Remove email account"
        message="Are you sure you want to remove this email account? Campaigns using it will fail to send."
        confirmLabel="Remove"
        icon="bi-trash"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AnimatedPage>
  )
}
