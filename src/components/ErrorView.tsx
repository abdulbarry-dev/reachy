'use client'

import { useState, useCallback, useId } from 'react'
import Link from 'next/link'
import { BrandLogo } from './BrandLogo'
import {
  getErrorConfig,
  sanitizeError,
  type ErrorStateConfig,
} from '../lib/errors'

export interface ErrorViewProps {
  /** HTTP status code (401, 403, 404, 419, 429, 500, 503). Defaults to 500 if error is passed, or 404/500 based on context. */
  readonly statusCode?: number
  /** Raw or caught exception (stack traces, paths, and internal details will be stripped). */
  readonly error?: unknown
  /** Optional title override */
  readonly title?: string
  /** Optional message override (only used if explicitly safe/operational) */
  readonly message?: string
  /** Explicit reference / correlation ID */
  readonly referenceId?: string
  /** Optional primary CTA button label override */
  readonly primaryCtaLabel?: string
  /** Recovery callback to reset the nearest error boundary */
  readonly onReset?: () => void
  /** Render full-page centered canvas (true) or compact nested card for layouts (false). Defaults to true. */
  readonly fullPage?: boolean
}

function getBadgeVariantClass(code: number): { badgeClass: string; iconBgClass: string; iconColor: string } {
  if (code >= 500) {
    return {
      badgeClass: 'badge-reachy-failed',
      iconBgClass: 'bg-danger-subtle',
      iconColor: '#dc2626',
    }
  }
  if (code === 429 || code === 419) {
    return {
      badgeClass: 'badge-reachy-queued',
      iconBgClass: 'bg-warning-subtle',
      iconColor: '#d97706',
    }
  }
  if (code === 401) {
    return {
      badgeClass: 'badge-reachy-draft',
      iconBgClass: 'bg-info-subtle',
      iconColor: '#2f8e92',
    }
  }
  // 404 and defaults
  return {
    badgeClass: 'badge-reachy-draft',
    iconBgClass: 'bg-light',
    iconColor: '#475569',
  }
}

export function ErrorView({
  statusCode: propStatusCode,
  error,
  title: propTitle,
  message: propMessage,
  referenceId: propRefId,
  primaryCtaLabel: propPrimaryCtaLabel,
  onReset,
  fullPage = true,
}: ErrorViewProps) {
  const [copied, setCopied] = useState(false)
  const copyFeedbackId = useId()

  // Sanitize error if provided, or build config from status code
  const sanitized = error ? sanitizeError(error) : undefined
  const effectiveCode = propStatusCode ?? sanitized?.statusCode ?? 500
  const config: ErrorStateConfig = sanitized ?? getErrorConfig(effectiveCode)

  const effectiveTitle = propTitle ?? config.title
  const effectiveMessage = propMessage ?? config.message
  const effectiveRefId = propRefId ?? sanitized?.referenceId
  const effectivePrimaryLabel = propPrimaryCtaLabel ?? config.primaryCta.label

  const { badgeClass, iconBgClass, iconColor } = getBadgeVariantClass(effectiveCode)

  const handleCopyReference = useCallback(async () => {
    if (!effectiveRefId) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(effectiveRefId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      // Fallback: clipboard access denied or unavailable
    }
  }, [effectiveRefId])

  const handlePrimaryClick = useCallback(() => {
    if (onReset) {
      onReset()
      return
    }
    if (config.primaryCta.action === 'reload' && typeof window !== 'undefined') {
      window.location.reload()
      return
    }
  }, [onReset, config.primaryCta.action])

  const content = (
    <div
      className={`card-reachy p-4 p-sm-5 text-center ${fullPage ? 'shadow-lg' : ''}`}
      style={{
        maxWidth: 540,
        width: '100%',
        margin: '0 auto',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Status Badge */}
      <div className="mb-3 d-flex justify-content-center">
        <span
          className={`badge rounded-pill px-3 py-2 fw-semibold text-uppercase ${badgeClass}`}
          style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }}
        >
          {config.badge}
        </span>
      </div>

      {/* Semantic Icon Circle */}
      <div
        className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${iconBgClass}`}
        style={{ width: 64, height: 64 }}
      >
        <i className={`bi ${config.icon}`} style={{ fontSize: '1.85rem', color: iconColor }} aria-hidden="true" />
      </div>

      {/* Main Title */}
      <h1
        className="h3 fw-bold mb-2"
        style={{ color: 'var(--reachy-dark, #0f172a)', letterSpacing: '-0.02em', lineHeight: 1.25 }}
      >
        {effectiveTitle}
      </h1>

      {/* Sanitized Message */}
      <p
        className="mb-4"
        style={{
          color: 'var(--reachy-muted, #64748b)',
          fontSize: '0.9375rem',
          lineHeight: 1.55,
          maxWidth: 460,
          margin: '0 auto 1.5rem',
        }}
      >
        {effectiveMessage}
      </p>

      {/* Correlation / Reference ID Badge */}
      {effectiveRefId ? (
        <div
          className="d-flex align-items-center justify-content-between p-2 px-3 mb-4 rounded-3 text-start"
          style={{
            backgroundColor: 'var(--reachy-surface-subtle, #f8fafc)',
            border: '1px solid var(--reachy-border-color, #e2e8f0)',
          }}
        >
          <div className="d-flex flex-column" style={{ minWidth: 0 }}>
            <span
              className="text-uppercase fw-semibold"
              style={{ fontSize: '0.6875rem', color: 'var(--reachy-muted, #64748b)', letterSpacing: '0.05em' }}
            >
              Reference ID
            </span>
            <code
              className="text-truncate fw-medium"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8125rem',
                color: 'var(--reachy-dark, #0f172a)',
              }}
            >
              {effectiveRefId}
            </code>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none d-inline-flex align-items-center gap-1 py-1 px-2 ms-2 rounded-2"
            style={{
              color: copied ? 'var(--reachy-primary, #3AB397)' : 'var(--reachy-muted, #64748b)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            onClick={handleCopyReference}
            aria-label={copied ? 'Reference ID copied' : 'Copy reference ID'}
            aria-describedby={copyFeedbackId}
          >
            <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <span id={copyFeedbackId} className="visually-hidden" aria-live="polite">
            {copied ? 'Reference ID copied to clipboard' : ''}
          </span>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 pt-1">
        {/* Primary CTA */}
        {config.primaryCta.href && !onReset ? (
          <Link href={config.primaryCta.href} className="btn-reachy w-100 w-sm-auto text-center">
            {effectivePrimaryLabel}
          </Link>
        ) : (
          <button
            type="button"
            className="btn-reachy w-100 w-sm-auto"
            onClick={handlePrimaryClick}
          >
            {effectivePrimaryLabel}
          </button>
        )}

        {/* Secondary CTA */}
        {config.secondaryCta?.href ? (
          <Link href={config.secondaryCta.href} className="btn-reachy-outline w-100 w-sm-auto text-center">
            {config.secondaryCta.label}
          </Link>
        ) : config.secondaryCta?.action === 'back' ? (
          <button
            type="button"
            className="btn-reachy-outline w-100 w-sm-auto"
            onClick={() => {
              if (typeof window !== 'undefined') window.history.back()
            }}
          >
            {config.secondaryCta.label}
          </button>
        ) : null}
      </div>
    </div>
  )

  if (!fullPage) {
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        <div className="d-flex align-items-center justify-content-center p-3 p-sm-4 w-100 min-vh-50">
          {content}
        </div>
      </>
    )
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div
        className="d-flex flex-column align-items-center justify-content-center p-3 p-sm-4"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--reachy-bg-soft, #f4fbf9)',
        }}
      >
        <header className="mb-4 text-center">
          <Link
            href="/"
            className="d-inline-flex align-items-center gap-2 text-decoration-none"
            style={{ color: 'var(--reachy-dark, #0f172a)' }}
            aria-label="Reachy Home"
          >
            <BrandLogo size={32} style={{ color: 'var(--reachy-primary, #3AB397)' }} />
            <span className="fw-bolder fs-4" style={{ letterSpacing: '-0.03em' }}>
              Reachy
            </span>
          </Link>
        </header>

        <main className="w-100 d-flex justify-content-center">
          {content}
        </main>
      </div>
    </>
  )
}
