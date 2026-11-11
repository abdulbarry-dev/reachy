import { Skeleton } from './Skeleton'

/**
 * Full-screen placeholder shown while the initial session read settles.
 *
 * It used to be inline in `ProtectedRoute`, which made `App.tsx` carry fifty
 * lines of layout that have nothing to do with routing.
 */
export function AuthLoadingSkeleton() {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--reachy-bg-soft)' }}
    >
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="text-center mb-2">
          <div className="d-inline-flex align-items-center gap-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={100} height={20} borderRadius={6} />
          </div>
        </div>
        <div className="d-flex gap-3" style={{ padding: '0 24px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton width="100%" height={90} borderRadius={16} />
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width="40%" height={20} borderRadius={6} />
          {[0, 1].map((i) => (
            <Skeleton key={i} width="100%" height={140} borderRadius={16} />
          ))}
        </div>
      </div>
    </div>
  )
}
