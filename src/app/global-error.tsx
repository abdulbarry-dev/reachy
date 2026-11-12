'use client'

import { useState } from 'react'
import { ErrorView } from '../components/ErrorView'
import { DevErrorView } from '../components/DevErrorView'
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
  const [showProductionPreview, setShowProductionPreview] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: isDev && !showProductionPreview ? '#070a12' : 'var(--reachy-bg-soft, #f4fbf9)',
        }}
      >
        {isDev && !showProductionPreview ? (
          <DevErrorView
            error={error}
            onReset={reset}
            onTogglePreview={() => setShowProductionPreview(true)}
          />
        ) : (
          <ErrorView
            statusCode={500}
            error={error}
            onReset={reset}
            onToggleDevView={isDev ? () => setShowProductionPreview(false) : undefined}
          />
        )}
      </body>
    </html>
  )
}
