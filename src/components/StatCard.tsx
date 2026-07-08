import { Card } from 'react-bootstrap'

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
}

export function StatCard({ icon, label, value, variant = 'primary' }: StatCardProps) {
  const bgClass = `text-bg-${variant}`

  return (
    <div>
      <Card className="card-reachy border-0 h-100">
        <Card.Body className="d-flex align-items-center gap-3">
          <div className={`stat-icon ${bgClass}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div>
            <h3 className="mb-0 fw-bold">{value}</h3>
            <p className="text-muted small mb-0">{label}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
