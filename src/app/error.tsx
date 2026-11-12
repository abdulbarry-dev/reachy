'use client'

import { useEffect } from 'react'
import { ErrorView } from '../components/ErrorView'

export default function RootError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    // Log sanitized error telemetry in client console / monitoring
    // Avoid printing raw passwords or sensitive credentials
    if (process.env.NODE_ENV === 'development') {
      console.error('[RootError Caught]', error)
    }
  }, [error])

  return <ErrorView statusCode={500} error={error} onReset={reset} />
}
