'use client'

import { useEffect, useState } from 'react'
import { ErrorView } from '../../components/ErrorView'
import { DevErrorView } from '../../components/DevErrorView'

export default function DashboardError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  const [showProductionPreview, setShowProductionPreview] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev) {
      console.error('[DashboardError Caught in Dev]', error)
    }
  }, [error, isDev])

  if (isDev && !showProductionPreview) {
    return (
      <div className="container-fluid py-4" style={{ maxWidth: 1000 }}>
        <DevErrorView
          error={error}
          onReset={reset}
          onTogglePreview={() => setShowProductionPreview(true)}
          fullPage={false}
        />
      </div>
    )
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 900 }}>
      <ErrorView
        statusCode={500}
        error={error}
        onReset={reset}
        fullPage={false}
        onToggleDevView={isDev ? () => setShowProductionPreview(false) : undefined}
      />
    </div>
  )
}
