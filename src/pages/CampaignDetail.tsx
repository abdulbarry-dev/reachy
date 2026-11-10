import { Button, Card, Col, Row, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatedPage } from '../components/AnimatedPage'
import { useRecipients } from '../hooks/useRecipients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { SkeletonTable } from '../components/Skeleton'
import { getEdgeFunctionUrl } from '../lib/edge-functions'
import { campaignStatusBadgeClass } from '../lib/campaignStatus'

/** While a campaign is running, keep counts and recipient rows fresh. */
const RUNNING_REFRESH_MS = 30_000

const recipientBadgeClass: Record<string, string> = {
  pending: 'badge-reachy-draft',
  sending: 'badge-reachy-running',
  sent: 'badge-reachy-completed',
  failed: 'badge-reachy-failed',
}

export function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const { campaigns, loading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns()
  const { recipients, loading: recipientsLoading, error, refetch } = useRecipients(campaignId)
  const { toast } = useToast()
  const [starting, setStarting] = useState(false)

  const campaign = campaigns.find((c) => c.id === campaignId)
  const isRunning = campaign?.status === 'running'

  // Poll while the campaign is actively sending; stops automatically once the
  // status flips (the campaigns refetch updates `campaign`, clearing the effect).
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      refetch()
      refetchCampaigns()
    }, RUNNING_REFRESH_MS)
    return () => clearInterval(interval)
  }, [isRunning, refetch, refetchCampaigns])

  const handleStart = async () => {
    if (!campaignId) return
    setStarting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(getEdgeFunctionUrl('start-campaign'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ campaignId }),
      })

      if (!res.ok) {
        let errMsg = 'Failed to start campaign'
        try { const err = await res.json(); errMsg = err.error ?? errMsg } catch { /* use fallback */ }
        throw new Error(errMsg)
      }

      toast('Campaign started successfully', 'success')
      refetch()
      refetchCampaigns()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start campaign', 'error')
    } finally {
      setStarting(false)
    }
  }

  if (campaignsLoading) {
    return (
      <AnimatedPage>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <div className="spinner-border text-primary" />
        </div>
      </AnimatedPage>
    )
  }

  if (!campaign) {
    return (
      <AnimatedPage>
        <div className="alert alert-warning">Campaign not found</div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <h1 className="page-title h3 mb-0">{campaign.name}</h1>
            <span className={`badge px-2.5 py-1.5 rounded-pill ${campaignStatusBadgeClass[campaign.status] ?? 'bg-secondary text-white'} fw-bold campaign-status-badge`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>
          <p className="text-muted mb-0 small">
            {campaign.sent_recipients} sent · {campaign.failed_recipients} failed · {campaign.pending_recipients} pending
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" className="rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5" onClick={() => navigate('/dashboard')}>
            <i className="bi bi-arrow-left"></i>
            <span>Back</span>
          </Button>
          {campaign.status === 'draft' && (
            <Button variant="primary" className="btn-gradient rounded-pill px-4 py-1.5 d-inline-flex align-items-center gap-1.5" onClick={handleStart} disabled={starting}>
              {starting ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <i className="bi bi-play-fill fs-5"></i>
              )}
              <span>Start campaign</span>
            </Button>
          )}
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="card-reachy border-0 p-3">
            <h6 className="text-muted small text-uppercase mb-2">Subject template</h6>
            <code>{campaign.subject_template}</code>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="card-reachy border-0 p-3">
            <h6 className="text-muted small text-uppercase mb-2">Rate limits</h6>
            <p className="mb-0 small">
              {campaign.send_rate_seconds}s between sends · {campaign.daily_cap} daily cap
            </p>
          </Card>
        </Col>
      </Row>

      <Card className="card-reachy border-0">
        <Card.Body>
          <h5 className="mb-3">Recipients ({recipientsLoading ? '' : recipients.length})</h5>
          {recipientsLoading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="table-reachy mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Sent at</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-medium cell-email" title={r.email}>{r.email}</td>
                      <td>{r.name || '—'}</td>
                      <td>
                        <span className={`badge px-2.5 py-1 rounded-pill ${recipientBadgeClass[r.status ?? 'pending']}`}>
                          {r.status || 'pending'}
                        </span>
                      </td>
                      <td className="small">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</td>
                      <td className="small text-danger cell-error" title={r.error_message || undefined}>{r.error_message || '—'}</td>
                    </tr>
                  ))}
                  {recipients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border-0">
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <i className="bi bi-inbox"></i>
                          </div>
                          <h6 className="empty-state-title">No recipients yet</h6>
                          <p className="empty-state-text">
                            This campaign doesn't have any recipients to send to.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </AnimatedPage>
  )
}
