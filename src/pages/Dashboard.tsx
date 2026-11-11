import { useMemo, useCallback } from 'react'
import { Card, Col, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { AnimatedPage } from '../components/AnimatedPage'
import { StatCard } from '../components/StatCard'
import { useCampaigns } from '../hooks/useCampaigns'
import { SkeletonStatCard, SkeletonCampaignCard } from '../components/Skeleton'
import { CampaignCard } from '../components/CampaignCard'
import { StarfieldCanvas } from './landing/StarfieldCanvas'

export function Dashboard() {
  const navigate = useNavigate()
  const { campaigns, loading, error, refetch } = useCampaigns()

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
        <Card className="card-reachy border-0">
          <div className="empty-state">
            <div className="empty-state-icon empty-state-icon-danger">
              <i className="bi bi-wifi-off" />
            </div>
            <h5 className="empty-state-title">Couldn't load your dashboard</h5>
            <p className="empty-state-text">{error}</p>
            <button type="button" className="btn btn-gradient" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        </Card>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Dashboard"
        description="Your outreach campaigns and metrics at a glance"
        actions={
          <Link to="/compose" className="btn btn-gradient">
            <i className="bi bi-plus-lg fs-6"></i>
            <span>New campaign</span>
          </Link>
        }
      />

      {loading ? (
        <Row className="g-4 mb-4 mb-sm-5">
          {[0, 1, 2, 3].map((i) => (
            <Col key={i} xs={12} sm={6} lg={3}>
              <SkeletonStatCard delay={i * 0.05} />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="mc-band mb-4 mb-sm-5">
          <div className="mc-atmosphere" aria-hidden="true">
            <StarfieldCanvas className="mc-stars" starCount={60} />
            <div className="mc-aurora mc-aurora-1" />
            <div className="mc-aurora mc-aurora-2" />
          </div>
          <Row className="g-3 g-md-4 mc-content">
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
          </Row>
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="section-title mb-0">Campaigns</h4>
        {!loading && (
          <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold small">
            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
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
        <Card className="card-reachy border-0">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-megaphone" />
            </div>
            <h5 className="empty-state-title">No campaigns created yet</h5>
            <p className="empty-state-text">
              Create your first email campaign to begin reaching out to your prospects automatically.
            </p>
            <Link to="/compose" className="btn btn-gradient">
              Create Campaign
            </Link>
          </div>
        </Card>
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
