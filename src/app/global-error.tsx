'use client'

import { useEffect } from 'react'
import { ErrorView } from '../components/ErrorView'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../index.css'

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError Caught]', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'var(--reachy-bg-soft, #f4fbf9)' }}>
        <ErrorView statusCode={500} error={error} onReset={reset} />
      </body>
    </html>
  )
}
