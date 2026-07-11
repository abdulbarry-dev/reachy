import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addRecipients } from '../store/recipientsSlice'
import { AnimatedPage } from '../components/AnimatedPage'
import { FileDropzone } from '../components/FileDropzone'
import { useEmailAccounts } from '../hooks/useEmailAccounts'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { Skeleton } from '../components/Skeleton'
import type { RootState, AppDispatch } from '../store'
import type { ImportedRecipient } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '') ?? ''

export function Compose() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const importedRecipients = useSelector((state: RootState) => state.recipients.items)
  const { accounts, loading: accountsLoading } = useEmailAccounts()

  const [emailAccountId, setEmailAccountId] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sendRate, setSendRate] = useState(60)
  const [dailyCap, setDailyCap] = useState(90)
  const [previewIndex, setPreviewIndex] = useState(0)
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewRecipient = importedRecipients[previewIndex] ?? null

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  const previewHtml = useMemo(() => {
    return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
      if (!previewRecipient) return `{{${key}}}`
      const val = key === 'email' ? previewRecipient.email
        : key === 'name' ? (previewRecipient.name ?? '')
        : key === 'company' ? (previewRecipient.company ?? '')
        : previewRecipient.variables?.[key] ?? ''
      return escapeHtml(val)
    })
  }, [body, previewRecipient])

  const handleUpload = (parsed: ImportedRecipient[]) => {
    dispatch(addRecipients(parsed))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailAccountId) {
      setError('Select an email account first.')
      return
    }
    if (!campaignName.trim()) {
      setError('Enter a campaign name.')
      return
    }
    if (!subject.trim()) {
      setError('Enter a subject template.')
      return
    }
    if (!body.trim()) {
      setError('Enter a body template.')
      return
    }
    if (importedRecipients.length === 0) {
      setError('Add at least one recipient.')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          emailAccountId,
          name: campaignName.trim(),
          subjectTemplate: subject.trim(),
          bodyTemplate: body.trim(),
          recipients: importedRecipients,
          sendRateSeconds: sendRate,
          dailyCap,
        }),
      })

      if (!res.ok) {
        let errMsg = 'Failed to create campaign'
        try { const err = await res.json(); errMsg = err.error ?? errMsg } catch { /* use fallback */ }
        throw new Error(errMsg)
      }

      const data = await res.json()

      toast('Campaign created successfully', 'success')
      navigate(`/campaigns/${data.campaignId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AnimatedPage>
      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 mb-sm-5">
        <div>
          <h1 className="h2 mb-1 page-title">New campaign</h1>
          <p className="text-muted mb-0 page-header-desc">Write once, personalize for every recipient.</p>
        </div>
        {importedRecipients.length > 0 && (
          <span className="count-badge d-inline-flex align-items-center gap-1.5">
            <i className="bi bi-people-fill"></i>
            {importedRecipients.length} recipients ready
          </span>
        )}
      </div>

      <div>
        <Row className="g-4">
          <Col lg={7} className="min-w-0">
            <div className="min-w-0">
              <Card className="card-reachy border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="section-icon">
                      <i className="bi bi-pencil-square"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Campaign details</h5>
                      <p className="text-muted small mb-0">Configure your sender and message</p>
                    </div>
                  </div>

                  <Form onSubmit={handleCreate}>
                    {accountsLoading ? (
                      <div className="field">
                        <Skeleton width={80} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width="100%" height={44} borderRadius={10} />
                      </div>
                    ) : accounts.length === 0 ? (
                      <Alert variant="warning" className="mb-3 border-0 rounded-3 d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>
                          No email accounts connected.{' '}
                          <a href="/settings" className="fw-semibold text-decoration-none">Connect one in Settings</a> first.
                        </span>
                      </Alert>
                    ) : (
                      <div className="field">
                        <Form.Label className="form-label-reachy" htmlFor="compose-from">From</Form.Label>
                        <Form.Select
                          id="compose-from"
                          className="form-select-reachy"
                          autoComplete="off"
                          value={emailAccountId}
                          onChange={(e) => setEmailAccountId(e.target.value)}
                          required
                        >
                          <option value="">Select a sender account</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.from_name} &lt;{acc.from_email}&gt;
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    )}

                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="compose-name">Campaign name</Form.Label>
                      <Form.Control
                        id="compose-name"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="Q3 Outreach"
                        className="form-control-reachy"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="compose-subject">Subject template</Form.Label>
                      <Form.Control
                        id="compose-subject"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="Quick question, {{name}}"
                        className="form-control-reachy"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                      <div className="form-hint-reachy">
                        <i className="bi bi-tag"></i>
                        <span>Use <span className="var-chip">{'{{name}}'}</span> to personalize per recipient.</span>
                      </div>
                    </div>

                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="compose-body">Email body (HTML)</Form.Label>
                      <Form.Control
                        id="compose-body"
                        as="textarea"
                        rows={8}
                        inputMode="text"
                        autoComplete="off"
                        placeholder={'<p>Hi {{name}},</p>\n<p>...</p>'}
                        className="form-control-reachy"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                      />
                      <div className="form-hint-reachy">
                        <i className="bi bi-code-slash"></i>
                        <span>Use {'{{name}}'}, {'{{company}}'}, or any column from your import.</span>
                      </div>
                    </div>

                    {/* Sending limits — grouped */}
                    <div className="field-group">
                      <div className="field-group-label">
                        <i className="bi bi-speedometer2"></i>
                        Sending Limits
                      </div>
                      <Row className="g-3">
                        <Col xs={12} sm={6}>
                          <div className="field mb-0">
                            <Form.Label className="form-label-reachy" htmlFor="compose-interval">Send interval (seconds)</Form.Label>
                            <Form.Control
                              id="compose-interval"
                              type="number"
                              inputMode="numeric"
                              min={30}
                              className="form-control-reachy"
                              value={sendRate}
                              onChange={(e) => setSendRate(Math.max(30, Number(e.target.value)))}
                            />
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="field mb-0">
                            <Form.Label className="form-label-reachy" htmlFor="compose-daily-cap">Daily cap</Form.Label>
                            <Form.Control
                              id="compose-daily-cap"
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={500}
                              className="form-control-reachy"
                              value={dailyCap}
                              onChange={(e) => setDailyCap(Math.max(1, Math.min(500, Number(e.target.value))))}
                            />
                          </div>
                        </Col>
                      </Row>
                      <div className="form-hint-reachy mt-2 mb-0">
                        <i className="bi bi-shield-check"></i>
                        <span>Defaults: 60s between sends, 90/day — safely under Gmail limits.</span>
                      </div>
                    </div>

                    {error && (
                      <div className="form-error-reachy">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>{error}</span>
                      </div>
                    )}

                    <button type="submit" className="btn-submit-reachy" disabled={creating || accounts.length === 0}>
                      {creating ? (
                        <><span className="spinner-border spinner-border-sm" />Creating campaign...</>
                      ) : (
                        <><i className="bi bi-send"></i>Create campaign</>
                      )}
                    </button>
                  </Form>
                </Card.Body>
              </Card>
            </div>

            <div>
              <Card className="card-reachy border-0">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="section-icon">
                      <i className="bi bi-people"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Recipients</h5>
                      <p className="text-muted small mb-0">{importedRecipients.length} in scratchpad</p>
                    </div>
                  </div>
                  <FileDropzone onUpload={handleUpload} />
                  <div className="info-hint mt-3">
                    <i className="bi bi-info-circle"></i>
                    <span>Recipients from the scratchpad are included. Upload more files to add.</span>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col lg={5} className="min-w-0">
            <div className="h-100 min-w-0">
              <Card className="card-reachy border-0 h-100">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-4 preview-header-compact flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3 min-w-0">
                      <div className="section-icon">
                        <i className="bi bi-eye"></i>
                      </div>
                      <div>
                        <h5 className="section-title mb-0">Live preview</h5>
                        <p className="text-muted small mb-0">See how recipients view your email</p>
                      </div>
                    </div>
                    {importedRecipients.length > 1 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => setPreviewIndex((i) => (i + 1) % importedRecipients.length)}
                      >
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Next
                      </Button>
                    )}
                  </div>

                  {previewRecipient ? (
                    <div className="d-flex flex-column flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-person-fill text-muted small"></i>
                        <span className="small text-muted">Previewing for</span>
                        <strong className="small text-dark">{previewRecipient.email}</strong>
                      </div>
                      <div className="preview-frame flex-grow-1">
                        <div className="preview-header">
                          <p className="text-muted small mb-0">Subject</p>
                          <p className="fw-semibold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>
                            {subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
                              if (key === 'email') return previewRecipient.email
                              if (key === 'name') return previewRecipient.name ?? ''
                              if (key === 'company') return previewRecipient.company ?? ''
                              return previewRecipient.variables?.[key] ?? ''
                            }) || '(no subject)'}
                          </p>
                        </div>
                        <div className="preview-body flex-grow-1">
                          <div className="email-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h6 className="text-muted small text-uppercase fw-bold mb-2" style={{ letterSpacing: '0.06em' }}>Available variables</h6>
                        <Stack direction="horizontal" gap={2} className="flex-wrap">
                          <span className="var-chip">{'{{email}}'}</span>
                          <span className="var-chip">{'{{name}}'}</span>
                          <span className="var-chip">{'{{company}}'}</span>
                        </Stack>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state flex-grow-1 d-flex align-items-center justify-content-center">
                      <div>
                        <div className="empty-state-icon">
                          <i className="bi bi-envelope"></i>
                        </div>
                        <h6 className="empty-state-title">No preview available</h6>
                        <p className="empty-state-text">
                          Import recipients to the scratchpad to see a live preview of your personalized email.
                        </p>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </AnimatedPage>
  )
}
