import { Alert, Card, Col, Form, Row } from 'react-bootstrap'
import Link from 'next/link'
import { SectionHeader } from '../../components/SectionHeader'
import { Skeleton } from '../../components/Skeleton'
import type { EmailAccount } from '../../types'
import type { CampaignDraft } from './useCampaignDraft'

interface CampaignDetailsFormProps {
  draft: CampaignDraft
  accounts: EmailAccount[]
  accountsLoading: boolean
  creating: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

/** Sender, name, subject, body and the sending limits, in one form. */
export function CampaignDetailsForm({ draft, accounts, accountsLoading, creating, error, onSubmit }: CampaignDetailsFormProps) {
  return (
    <div className="min-w-0">
      <Card className="card-reachy border-0 mb-4">
        <Card.Body className="p-4">
          <SectionHeader
            icon="bi-pencil-square"
            title="Campaign details"
            description="Configure your sender and message"
            className="mb-4"
          />

          <Form onSubmit={onSubmit}>
            {accountsLoading ? (
              <div className="field">
                <Skeleton width={80} height={14} borderRadius={4} className="mb-2" />
                <Skeleton width="100%" height={44} borderRadius={10} />
              </div>
            ) : accounts.length === 0 ? (
              <Alert variant="warning" className="mb-3 border-0 rounded-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>
                  No email accounts connected.{' '}
                  <Link href="/settings" className="fw-semibold text-decoration-none">Connect one in Settings</Link> first.
                </span>
              </Alert>
            ) : (
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="compose-from">From</Form.Label>
                <Form.Select
                  id="compose-from"
                  className="form-select-reachy"
                  autoComplete="off"
                  value={draft.emailAccountId}
                  onChange={(e) => draft.setEmailAccountId(e.target.value)}
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
                value={draft.campaignName}
                onChange={(e) => draft.setCampaignName(e.target.value)}
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
                value={draft.subject}
                onChange={(e) => draft.setSubject(e.target.value)}
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
                value={draft.body}
                onChange={(e) => draft.setBody(e.target.value)}
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
                      value={draft.sendRate}
                      onChange={(e) => draft.setSendRate(Math.max(30, Number(e.target.value)))}
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
                      max={90}
                      className="form-control-reachy"
                      value={draft.dailyCap}
                      onChange={(e) => draft.setDailyCap(Math.max(1, Math.min(90, Number(e.target.value))))}
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
  )
}
