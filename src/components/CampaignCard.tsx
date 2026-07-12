import { memo, useCallback } from 'react'
import { Card } from 'react-bootstrap'
import type { CampaignWithCounts } from '../types'

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

interface CampaignCardProps {
  campaign: CampaignWithCounts
  onClick: (id: string) => void
}

export const CampaignCard = memo(function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const handleClick = useCallback(() => onClick(campaign.id), [onClick, campaign.id])

  const total = campaign.total_recipients || 0
  const processed = campaign.sent_recipients + campaign.failed_recipients
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <Card
      className="card-reachy border-0 h-100 cursor-pointer position-relative overflow-hidden"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
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
                backgroundColor: statusProgressBg[campaign.status] ?? 'var(--reachy-primary)',
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
  )
})

CampaignCard.displayName = 'CampaignCard'