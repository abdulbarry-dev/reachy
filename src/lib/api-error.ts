/**
 * Reachy — Backend & API Exception Hardening Utility
 *
 * Enforces production-grade API error envelopes, sanitized operational messaging,
 * zero stack/path/SQL leakage, and correlation/reference ID logging.
 */

import { generateReferenceId } from './errors'

export interface ApiErrorPayload {
  readonly status: number
  readonly code: string
  readonly message: string
  readonly reference_id?: string
  readonly errors?: Record<string, string[]>
}

export interface ApiErrorEnvelope {
  readonly error: ApiErrorPayload
}

export interface ApiErrorInput {
  status?: number
  code?: string
  message?: string
  referenceId?: string
  errors?: Record<string, string[]>
  isOperational?: boolean
}

const DEFAULT_ERROR_MESSAGES: Record<number, { code: string; message: string }> = {
  400: {
    code: 'BAD_REQUEST',
    message: 'The server could not understand the request due to invalid syntax.',
  },
  401: {
    code: 'UNAUTHORIZED',
    message: 'Authentication credentials are required or have expired.',
  },
  403: {
    code: 'FORBIDDEN',
    message: 'Access to this resource is prohibited.',
  },
  404: {
    code: 'NOT_FOUND',
    message: 'The requested resource could not be found.',
  },
  419: {
    code: 'SESSION_EXPIRED',
    message: 'Your security session has expired. Please refresh the page.',
  },
  422: {
    code: 'VALIDATION_FAILED',
    message: 'The provided data failed validation constraints.',
  },
  429: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please slow down and try again later.',
  },
  500: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred. Please reference the incident ID if contacting support.',
  },
  503: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service is temporarily unavailable due to maintenance.',
  },
}

/**
 * Creates a sanitized, secure error envelope strictly stripping internal stacks,
 * database strings, file paths, or credentials.
 */
export function createApiErrorEnvelope(
  error: unknown,
  statusOverride?: number,
  codeOverride?: string,
): ApiErrorEnvelope {
  const isObj = typeof error === 'object' && error !== null
  const errObj = isObj ? (error as Record<string, unknown>) : null

  const rawStatus = statusOverride ?? (typeof errObj?.status === 'number' ? errObj.status : undefined)
  const is422 = rawStatus === 422 || errObj?.code === 'VALIDATION_FAILED'
  const status = rawStatus ?? (is422 ? 422 : 500)

  const defaultMeta = DEFAULT_ERROR_MESSAGES[status] ?? DEFAULT_ERROR_MESSAGES[500]
  const code = codeOverride ?? (typeof errObj?.code === 'string' ? errObj.code : defaultMeta.code)

  // Only allow custom messages if explicitly flagged as operational or for client 4xx errors
  let message: string
  if (status < 500 && typeof errObj?.message === 'string' && errObj.message.trim().length > 0) {
    message = errObj.message
  } else if (errObj?.isOperational && typeof errObj?.message === 'string' && errObj.message.trim().length > 0) {
    message = errObj.message
  } else {
    message = defaultMeta.message
  }

  // Reference ID generation for 500-level incidents
  let referenceId: string | undefined
  if (status >= 500) {
    referenceId = typeof errObj?.referenceId === 'string' ? errObj.referenceId : generateReferenceId()
    // Server-side logging for diagnostics
    console.error(`[API ${status} Internal Error] [Ref: ${referenceId}]`, {
      referenceId,
      code,
      originalError: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    })
  }

  // Preserve validation errors on 422
  const errors = errObj !== null && 'errors' in errObj && typeof errObj.errors === 'object' && errObj.errors !== null
    ? (errObj.errors as Record<string, string[]>)
    : undefined

  const payload: ApiErrorPayload = {
    status,
    code,
    message,
    ...(referenceId ? { reference_id: referenceId } : {}),
    ...(errors ? { errors } : {}),
  }

  return { error: payload }
}

/**
 * Helper to construct a standard Response with JSON error envelope and security headers.
 */
export function formatApiErrorResponse(
  error: unknown,
  status = 500,
  code?: string,
): Response {
  const envelope = createApiErrorEnvelope(error, status, code)
  return new Response(JSON.stringify(envelope), {
    status: envelope.error.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
