'use client'

import { useEffect } from 'react'
import { ErrorView } from '../../components/ErrorView'

export default function DashboardError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DashboardError Caught]', error)
    }
  }, [error])

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 900 }}>
      <ErrorView statusCode={500} error={error} onReset={reset} fullPage={false} />
    </div>
  )
}
