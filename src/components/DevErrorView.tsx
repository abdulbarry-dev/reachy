'use client'

import { useState, useCallback } from 'react'

export interface DevErrorViewProps {
  /** The actual raw or caught error */
  readonly error?: unknown
  /** Optional React component stack captured by componentDidCatch */
  readonly componentStack?: string | null
  /** Callback to reset or retry the error boundary */
  readonly onReset?: () => void
  /** Callback to preview the production error page in dev */
  readonly onTogglePreview?: () => void
  /** Render full-page centered canvas (true) or compact nested card for layouts (false). Defaults to true. */
  readonly fullPage?: boolean
}

export function DevErrorView({
  error,
  componentStack,
  onReset,
  onTogglePreview,
  fullPage = true,
}: DevErrorViewProps) {
  const [copied, setCopied] = useState(false)

  const isErrorInstance = error instanceof Error
  const errorName = isErrorInstance ? error.name : 'Unhandled Exception'
  const errorMessage = isErrorInstance
    ? error.message
    : typeof error === 'string'
      ? error
      : (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string')
        ? String((error as { message: string }).message)
        : JSON.stringify(error) || 'An unknown error occurred'

  const errorStack = isErrorInstance ? error.stack : undefined
  const digest = error && typeof error === 'object' && 'digest' in error && typeof (error as { digest?: unknown }).digest === 'string'
    ? String((error as { digest: string }).digest)
    : undefined

  const handleCopy = useCallback(async () => {
    const textToCopy = [
      `[Reachy Development Error Diagnostics]`,
      `Name: ${errorName}`,
      `Message: ${errorMessage}`,
      digest ? `Digest: ${digest}` : '',
      '',
      `Stack Trace:`,
      errorStack || '(No stack trace available)',
      componentStack ? `\nComponent Stack:\n${componentStack}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      // Fallback if clipboard permission is denied
    }
  }, [errorName, errorMessage, digest, errorStack, componentStack])

  const content = (
    <div
      className="card-reachy p-4 p-md-5 w-100 text-start shadow-lg"
      style={{
        maxWidth: 960,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid var(--reachy-border-color, #e2e8f0)',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Dev Header Badge & Notice */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-4 border-bottom border-light-subtle">
        <div className="d-flex align-items-center gap-2">
          <span
            className="badge rounded-pill px-3 py-2 fw-bold text-uppercase"
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
            }}
          >
            DEVELOPMENT ERROR OVERLAY
          </span>
          <span
            className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill px-2.5 py-1.5 fw-medium"
            style={{ fontSize: '0.75rem' }}
          >
            NODE_ENV === &apos;development&apos;
          </span>
        </div>

        {onTogglePreview ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-3 py-1 px-3"
            onClick={onTogglePreview}
            style={{ fontSize: '0.8125rem', fontWeight: 600 }}
          >
            <i className="bi bi-eye" aria-hidden="true" />
            <span>Preview Production Error Page</span>
          </button>
        ) : null}
      </div>

      {/* Reassuring dev message */}
      <p
        className="mb-3 text-secondary"
        style={{ fontSize: '0.875rem', lineHeight: 1.5 }}
      >
        This diagnostic view is only displayed in development mode for live debugging and coding. In production, customers will see the brand-aligned Reachy error page.
      </p>

      {/* Actual Error Banner */}
      <div
        className="p-3 p-md-4 rounded-3 mb-4"
        style={{
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-exclamation-octagon-fill" style={{ color: '#dc2626', fontSize: '1.25rem' }} aria-hidden="true" />
          <h2
            className="h5 fw-bold m-0"
            style={{
              color: '#9f1239',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {errorName}
          </h2>
        </div>
        <div
          className="mt-2 fw-semibold"
          style={{
            color: '#881337',
            fontSize: '1rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            wordBreak: 'break-word',
          }}
        >
          {errorMessage}
        </div>

        {digest ? (
          <div className="mt-2 pt-2 border-top border-danger-subtle small text-secondary">
            Next.js Server Digest: <code className="text-dark fw-bold">{digest}</code>
          </div>
        ) : null}
      </div>

      {/* Action Controls Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        {onReset ? (
          <button
            type="button"
            className="btn-reachy d-inline-flex align-items-center gap-2"
            onClick={onReset}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        ) : null}

        <button
          type="button"
          className="btn-reachy-outline d-inline-flex align-items-center gap-2"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload()
          }}
        >
          <i className="bi bi-arrow-repeat" aria-hidden="true" />
          <span>Reload Window</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2"
          onClick={handleCopy}
          style={{ fontWeight: 600, fontSize: '0.875rem' }}
        >
          <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`} aria-hidden="true" />
          <span>{copied ? 'Copied!' : 'Copy Error & Stack'}</span>
        </button>
      </div>

      {/* Stack Trace Section */}
      {errorStack ? (
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span
              className="text-uppercase fw-semibold"
              style={{
                fontSize: '0.75rem',
                color: 'var(--reachy-muted, #64748b)',
                letterSpacing: '0.05em',
              }}
            >
              Call Stack Trace
            </span>
          </div>
          <pre
            className="p-3 rounded-3 text-start mb-0"
            style={{
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              maxHeight: 380,
              overflowX: 'auto',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <code>{errorStack}</code>
          </pre>
        </div>
      ) : null}

      {/* React Component Stack if available */}
      {componentStack ? (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span
              className="text-uppercase fw-semibold"
              style={{
                fontSize: '0.75rem',
                color: 'var(--reachy-muted, #64748b)',
                letterSpacing: '0.05em',
              }}
            >
              Component Hierarchy
            </span>
          </div>
          <pre
            className="p-3 rounded-3 text-start mb-0"
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              maxHeight: 240,
              overflowX: 'auto',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            <code>{componentStack}</code>
          </pre>
        </div>
      ) : null}
    </div>
  )

  if (!fullPage) {
    return (
      <div className="d-flex align-items-center justify-content-center p-2 p-md-3 w-100">
        {content}
      </div>
    )
  }

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center p-3 p-md-5 min-vh-100"
      style={{
        backgroundColor: '#070a12',
      }}
    >
      <main className="w-100 d-flex justify-content-center">
        {content}
      </main>
    </div>
  )
}
