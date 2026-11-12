'use client'

import { useState } from 'react'
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
