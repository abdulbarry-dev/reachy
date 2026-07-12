import { Skeleton } from './Skeleton'

export function PageFallback() {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <Skeleton width={48} height={48} borderRadius={12} className="mx-auto mb-3" />
        <Skeleton width={120} height={14} borderRadius={6} className="mx-auto" />
      </div>
    </div>
  )
}