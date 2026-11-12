'use client'

import { useEffect, useState } from 'react'
import { ErrorView } from '../components/ErrorView'
import { DevErrorView } from '../components/DevErrorView'

export default function RootError({
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
      console.error('[RootError Caught in Dev]', error)
    }
  }, [error, isDev])

  if (isDev && !showProductionPreview) {
    return (
      <DevErrorView
        error={error}
        onReset={reset}
        onTogglePreview={() => setShowProductionPreview(true)}
      />
    )
  }

  return (
    <ErrorView
      statusCode={500}
      error={error}
      onReset={reset}
      onToggleDevView={isDev ? () => setShowProductionPreview(false) : undefined}
    />
  )
}
