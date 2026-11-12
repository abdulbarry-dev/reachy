/**
 * Reachy — Error Configuration & Security Sanitization Engine
 *
 * Implements strict zero-leak error mapping, cryptographically secure correlation IDs,
 * open-redirect defense, and sanitized operational/5xx messaging.
 *
 * Strictly adheres to DESIGN.md tokens and production security specifications.
 */

export interface ErrorCta {
  readonly label: string
  readonly href?: string
  readonly action?: 'reload' | 'retry' | 'back'
}

export interface ErrorStateConfig {
  readonly statusCode: number
  readonly title: string
  readonly message: string
  readonly badge: string
  readonly icon: string
  readonly primaryCta: ErrorCta
  readonly secondaryCta?: ErrorCta
}

export const ERROR_STATES: Readonly<Record<number, ErrorStateConfig>> = {
  401: {
    statusCode: 401,
    title: 'Session Expired',
    message: 'Your session has ended or requires re-authentication. Please log in to continue.',
    badge: '401 / UNAUTHORIZED',
    icon: 'bi-shield-lock',
    primaryCta: { label: 'Log In', href: '/login' },
    secondaryCta: { label: 'Return Home', href: '/' },
  },
  403: {
    statusCode: 403,
    title: 'Access Restricted',
    message: "You don't have permission to view or manage this resource. If you believe this is in error, contact your workspace administrator.",
    badge: '403 / FORBIDDEN',
    icon: 'bi-slash-circle',
    primaryCta: { label: 'Back to Dashboard', href: '/dashboard' },
    secondaryCta: { label: 'Return Home', href: '/' },
  },
  404: {
    statusCode: 404,
    title: 'Page Not Found',
    message: 'The page or campaign you requested could not be found or may have been relocated.',
    badge: '404 / NOT FOUND',
    icon: 'bi-compass',
    primaryCta: { label: 'Back to Dashboard', href: '/dashboard' },
    secondaryCta: { label: 'Return Home', href: '/' },
  },
  419: {
    statusCode: 419,
    title: 'Page Expired',
    message: 'Your security session token has expired. Please refresh the page to obtain a fresh security token.',
    badge: '419 / EXPIRED',
    icon: 'bi-hourglass-bottom',
    primaryCta: { label: 'Refresh Page', action: 'reload' },
    secondaryCta: { label: 'Back to Dashboard', href: '/dashboard' },
  },
  429: {
    statusCode: 429,
    title: 'Rate Limit Exceeded',
    message: "You've exceeded the request frequency limit. Please wait a brief moment before trying again.",
    badge: '429 / RATE LIMITED',
    icon: 'bi-speedometer2',
    primaryCta: { label: 'Try Again', action: 'retry' },
    secondaryCta: { label: 'Back to Dashboard', href: '/dashboard' },
  },
  500: {
    statusCode: 500,
    title: 'Unexpected Application Error',
    message: 'An unexpected error occurred while processing your request. Our telemetry has logged the event.',
    badge: '500 / SERVER ERROR',
    icon: 'bi-exclamation-triangle',
    primaryCta: { label: 'Try Again', action: 'retry' },
    secondaryCta: { label: 'Back to Dashboard', href: '/dashboard' },
  },
  503: {
    statusCode: 503,
    title: 'Service Temporarily Unavailable',
    message: 'Reachy is undergoing scheduled system maintenance or dispatch optimizations. Service will resume shortly.',
    badge: '503 / MAINTENANCE',
    icon: 'bi-tools',
    primaryCta: { label: 'Check Status & Retry', action: 'retry' },
    secondaryCta: { label: 'Return Home', href: '/' },
  },
}

/**
 * Validates that a redirection path is strictly relative and safe against open-redirect exploits.
 */
export function isSafeInternalPath(path: string | undefined): boolean {
  if (!path) return false
  // Must start with a single forward slash and not double slashes (protocol-relative URL)
  if (!path.startsWith('/') || path.startsWith('//')) return false
  // Disallow backslashes and carriage returns
  if (path.includes('\\') || path.includes('\r') || path.includes('\n')) return false
  // Disallow scheme protocols
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false
  return true
}

/**
 * Generates a cryptographically strong correlation / reference ID for 500-level incidents.
 * Format: `ref_` + 16 lowercase hex characters (e.g., `ref_a3f890b21c45de67`).
 */
export function generateReferenceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `ref_${hex}`
  }
  // Safe fallback for environments lacking Web Crypto
  const hex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
  return `ref_${hex.padEnd(16, '0')}`
}

/**
 * Retrieves the normalized error configuration for a given status code.
 * Falls back to 500 if the status code is unknown.
 */
export function getErrorConfig(statusCode: number): ErrorStateConfig {
  const config = ERROR_STATES[statusCode] ?? ERROR_STATES[500]
  // Guarantee open redirect defense on configured links
  const safePrimaryHref = config.primaryCta.href && isSafeInternalPath(config.primaryCta.href)
    ? config.primaryCta.href
    : config.primaryCta.href ? '/dashboard' : undefined

  const safeSecondaryHref = config.secondaryCta?.href && isSafeInternalPath(config.secondaryCta.href)
    ? config.secondaryCta.href
    : config.secondaryCta?.href ? '/' : undefined

  return {
    ...config,
    primaryCta: {
      ...config.primaryCta,
      ...(safePrimaryHref ? { href: safePrimaryHref } : {}),
    },
    ...(config.secondaryCta
      ? {
          secondaryCta: {
            ...config.secondaryCta,
            ...(safeSecondaryHref ? { href: safeSecondaryHref } : {}),
          },
        }
      : {}),
  }
}

export interface SanitizedErrorResult extends ErrorStateConfig {
  readonly referenceId?: string
  readonly isOperational?: boolean
}

/**
 * Sanitizes any raw exception or operational error into a safe, client-presentable object.
 * Strictly guarantees ZERO leakage of stack traces, internal paths, SQL queries, or secrets.
 */
export function sanitizeError(error: unknown): SanitizedErrorResult {
  const isObject = typeof error === 'object' && error !== null
  const errObj = isObject ? (error as Record<string, unknown>) : null

  // Check if explicitly marked operational
  const isOperational = Boolean(errObj?.isOperational)
  const explicitStatus = typeof errObj?.statusCode === 'number' ? errObj.statusCode : undefined
  const digest = typeof errObj?.digest === 'string' && errObj.digest.trim().length > 0 ? errObj.digest : undefined

  const statusCode = explicitStatus && explicitStatus in ERROR_STATES ? explicitStatus : 500
  const baseConfig = getErrorConfig(statusCode)

  // Attach referenceId for 500-level incidents or if Next.js provided a digest
  const referenceId = statusCode >= 500 || digest ? (digest ?? generateReferenceId()) : undefined

  if (isOperational && typeof errObj?.message === 'string' && errObj.message.trim().length > 0) {
    return {
      ...baseConfig,
      message: errObj.message,
      isOperational: true,
      referenceId,
    }
  }

  return {
    ...baseConfig,
    isOperational: false,
    referenceId,
  }
}
