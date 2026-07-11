

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width, height = 16, borderRadius = 6, className, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className ?? ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  )
}

interface SkeletonStatCardProps {
  delay?: number
}

export function SkeletonStatCard({ delay = 0 }: SkeletonStatCardProps) {
  return (
    <div className="skeleton-card" style={{ animationDelay: `${delay}s` }}>
      <div className="d-flex align-items-center gap-3 p-4">
        <Skeleton width={52} height={52} borderRadius={14} />
        <div style={{ flex: 1 }}>
          <Skeleton width={60} height={28} borderRadius={6} />
          <Skeleton width={90} height={14} borderRadius={6} style={{ marginTop: 6 }} />
        </div>
      </div>
    </div>
  )
}

interface SkeletonCampaignCardProps {
  delay?: number
}

export function SkeletonCampaignCard({ delay = 0 }: SkeletonCampaignCardProps) {
  return (
    <div className="skeleton-card" style={{ animationDelay: `${delay}s`, padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Skeleton width={100} height={22} borderRadius={20} />
        <Skeleton width={40} height={16} borderRadius={4} />
      </div>
      <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={6} borderRadius={3} style={{ marginBottom: 16 }} />
      <div className="d-flex justify-content-between pt-3 border-top" style={{ borderColor: 'var(--reachy-border)' }}>
        <Skeleton width={60} height={14} borderRadius={4} />
        <Skeleton width={70} height={14} borderRadius={4} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  delay?: number
}

export function SkeletonTable({ rows = 5, columns = 4, delay = 0 }: SkeletonTableProps) {
  return (
    <div style={{ animationDelay: `${delay}s` }}>
      <div className="d-flex gap-4 mb-3" style={{ padding: '1rem 0.75rem' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? 60 : `${80 + Math.random() * 20}%`} height={14} borderRadius={4} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="d-flex gap-4 align-items-center" style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(58,179,151,0.05)' }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              width={j === 0 ? 60 : `${40 + Math.random() * 40}%`}
              height={14}
              borderRadius={4}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
