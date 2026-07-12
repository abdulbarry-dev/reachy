import { useMemo, useCallback } from 'react'
import { Card, Col, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedPage } from '../components/AnimatedPage'
import { StatCard } from '../components/StatCard'
import { useCampaigns } from '../hooks/useCampaigns'
import { SkeletonStatCard, SkeletonCampaignCard } from '../components/Skeleton'
import { CampaignCard } from '../components/CampaignCard'

export function Dashboard() {
  const navigate = useNavigate()
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

  const handleCampaignClick = useCallback((id: string) => {
    navigate(`/campaigns/${id}`)
  }, [navigate])

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
        <Link to="/compose" className="btn btn-gradient px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 text-decoration-none">
          <i className="bi bi-plus-lg fs-6"></i>
          <span>New campaign</span>
        </Link>
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
            <Link to="/compose" className="btn btn-gradient px-4 py-2 rounded-pill text-decoration-none">
              Create Campaign
            </Link>
          </Card>
        </div>
      ) : (
        <div>
          <Row className="g-4">
            {campaigns.map((campaign) => (
              <Col key={campaign.id} md={6} lg={4}>
                <CampaignCard campaign={campaign} onClick={handleCampaignClick} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </AnimatedPage>
  )
}
