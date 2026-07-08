import { useMemo } from 'react'
import { Button, Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { AnimatedPage } from '../components/AnimatedPage'
import { StatCard } from '../components/StatCard'
import { useCampaigns } from '../hooks/useCampaigns'
import { SkeletonStatCard, SkeletonCampaignCard } from '../components/Skeleton'

const statusBadgeClass: Record<string, string> = {
  draft: 'badge-reachy-draft',
  queued: 'badge-reachy-queued',
  running: 'badge-reachy-running',
  completed: 'badge-reachy-completed',
  paused: 'badge-reachy-paused',
}

const statusProgressBg: Record<string, string> = {
  draft: '#3AA8AD',
  queued: '#f59e0b',
  running: '#3AB397',
  completed: '#10b981',
  paused: '#f59e0b',
}

export function Dashboard() {
  const { campaigns, loading, error } = useCampaigns()

  const totals = useMemo(() => {
    const t = { total: 0, sent: 0, failed: 0, pending: 0 }
    for (const c of campaigns) {
      t.total += c.total_recipients
      t.sent += c.sent_recipients
      t.failed += c.failed_recipients
      t.pending += c.pending_recipients
    }
    return t
  }, [campaigns])

  if (error) {
    return (
      <AnimatedPage>
        <div className="alert alert-danger border-0 rounded-3 shadow-sm">{error}</div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 mb-sm-5">
        <div>
          <h1 className="h2 mb-1 fw-extrabold text-dark" style={{ letterSpacing: '-0.04em' }}>Dashboard</h1>
          <p className="text-muted mb-0">Your outreach campaigns and metrics at a glance</p>
        </div>
        <Button as={Link as any} to="/compose" className="btn-gradient px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg fs-6"></i>
          <span>New campaign</span>
        </Button>
      </div>

      <Row className="g-4 mb-4 mb-sm-5">
        {loading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Col key={i} xs={12} sm={6} lg={3}>
                <SkeletonStatCard delay={i * 0.05} />
              </Col>
            ))}
          </>
        ) : (
          <>
            <Col xs={12} sm={6} lg={3}>
              <StatCard icon="bi-people-fill" label="Total recipients" value={totals.total} variant="primary" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <StatCard icon="bi-hourglass-split" label="Pending" value={totals.pending} variant="warning" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <StatCard icon="bi-check-circle-fill" label="Sent" value={totals.sent} variant="success" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <StatCard icon="bi-exclamation-triangle-fill" label="Failed" value={totals.failed} variant="danger" />
            </Col>
          </>
        )}
      </Row>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.03em' }}>Campaigns</h4>
        {!loading && (
          <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold small">
            {campaigns.length} Active
          </span>
        )}
      </div>

      {loading ? (
        <Row className="g-4">
          {[0, 1, 2].map((i) => (
            <Col key={i} md={6} lg={4}>
              <SkeletonCampaignCard delay={i * 0.08} />
            </Col>
          ))}
        </Row>
      ) : campaigns.length === 0 ? (
        <div>
          <Card className="card-reachy border-0 p-5 text-center text-muted">
            <div className="mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-light text-muted" style={{ width: 80, height: 80, borderRadius: '50%' }}>
                <i className="bi bi-megaphone fs-1 text-secondary"></i>
              </div>
            </div>
            <h5 className="text-dark fw-bold mb-2">No campaigns created yet</h5>
            <p className="mb-4 text-muted small" style={{ maxWidth: 320, margin: '0 auto' }}>
              Create your first email campaign to begin reaching out to your prospects automatically.
            </p>
            <Button as={Link as any} to="/compose" className="btn-gradient px-4 py-2 rounded-pill">
              Create Campaign
            </Button>
          </Card>
        </div>
      ) : (
        <div>
          <Row className="g-4">
            {campaigns.map((campaign) => {
              const total = campaign.total_recipients || 0
              const processed = campaign.sent_recipients + campaign.failed_recipients
              const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0

              return (
                <Col key={campaign.id} md={6} lg={4}>
                  <div>
                    <Card
                      className="card-reachy border-0 h-100 cursor-pointer position-relative overflow-hidden"
                      as={Link as any}
                      to={`/campaigns/${campaign.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card.Body className="p-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className={`badge px-2.5 py-1.5 rounded-pill ${statusBadgeClass[campaign.status] ?? 'bg-secondary text-white'} fw-bold`} style={{ fontSize: '0.7rem', letterSpacing: '0.02em' }}>
                              <i className="bi bi-circle-fill me-1.5" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }}></i>
                              {campaign.status.toUpperCase()}
                            </span>
                            <span className="small text-muted fw-bold">{progressPercent}%</span>
                          </div>

                          <h5 className="fw-bold text-dark mb-3" style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                            {campaign.name}
                          </h5>
                          
                          <div className="dashboard-progress mb-4">
                            <div 
                              className="h-100" 
                              style={{ 
                                width: `${progressPercent}%`, 
                                borderRadius: 3, 
                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                backgroundColor: statusProgressBg[campaign.status] ?? 'var(--reachy-primary)'
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between flex-wrap gap-2 text-muted border-top pt-3" style={{ fontSize: '0.8rem' }}>
                          <span><strong className="text-dark fw-bold">{campaign.sent_recipients}</strong> Sent</span>
                          <span><strong className="text-dark fw-bold">{campaign.pending_recipients}</strong> Pending</span>
                          <span><strong className="text-dark fw-bold">{campaign.failed_recipients}</strong> Failed</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
              )
            })}
          </Row>
        </div>
      )}
    </AnimatedPage>
  )
}
