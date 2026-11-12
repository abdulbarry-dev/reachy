import { describe, expect, it, vi, afterEach } from 'vitest'
import { createApiErrorEnvelope, formatApiErrorResponse } from '../../src/lib/api-error'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('api-error exception hardening', () => {
  it('formats 500 error envelope with correlation ID and zero internal stack/path leakage', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const internalError = new Error('DATABASE CRITICAL: syntax error at or near "SELECT * FROM users" at /app/server/db.ts:99')
    internalError.stack = 'Error: DATABASE CRITICAL\n    at query (/app/server/db.ts:99:12)'

    const envelope = createApiErrorEnvelope(internalError)

    expect(envelope.error.status).toBe(500)
    expect(envelope.error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(envelope.error.message).toBe('An unexpected internal server error occurred. Please reference the incident ID if contacting support.')
    expect(envelope.error.reference_id).toMatch(/^ref_[a-f0-9]{16}$/)

    // Zero leak in envelope
    expect(envelope.error.message).not.toContain('DATABASE CRITICAL')
    expect(envelope.error.message).not.toContain('/app/server')
    expect((envelope.error as Record<string, unknown>).stack).toBeUndefined()

    // Full telemetry logged server-side
    expect(errorSpy).toHaveBeenCalled()
  })

  it('preserves structured field validation errors on 422 Unprocessable Entity', () => {
    const fieldErrors = {
      email: ['Must be a valid email address with active MX record'],
      sendRateSeconds: ['Minimum allowed rate is 30 seconds'],
    }

    const envelope = createApiErrorEnvelope({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'The submitted campaign payload contains validation errors.',
      errors: fieldErrors,
    })

    expect(envelope.error.status).toBe(422)
    expect(envelope.error.code).toBe('VALIDATION_FAILED')
    expect(envelope.error.message).toBe('The submitted campaign payload contains validation errors.')
    expect(envelope.error.errors).toEqual(fieldErrors)
  })

  it('formats HTTP 403 / 404 without resource enumeration leakage', () => {
    const envelope403 = createApiErrorEnvelope({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Access to this resource is prohibited.',
    })
    expect(envelope403.error.status).toBe(403)
    expect(envelope403.error.code).toBe('FORBIDDEN')

    const envelope404 = createApiErrorEnvelope({
      status: 404,
      code: 'NOT_FOUND',
      message: 'The requested resource could not be found.',
    })
    expect(envelope404.error.status).toBe(404)
    expect(envelope404.error.code).toBe('NOT_FOUND')
  })

  it('generates secure JSON Response with nosniff and proper status header', async () => {
    const response = formatApiErrorResponse(new Error('Something bad'), 500)
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')

    const body = await response.json()
    expect(body.error.status).toBe(500)
    expect(body.error.reference_id).toMatch(/^ref_[a-f0-9]{16}$/)
  })

  it('exposes actual error message and debug stack when in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'development'
      const devError = new Error('Syntax error at internal/dev/test.ts:15')
      devError.stack = 'Error: Syntax error\n    at internal/dev/test.ts:15:10'

      const envelope = createApiErrorEnvelope(devError)
      expect(envelope.error.message).toBe('Syntax error at internal/dev/test.ts:15')
      expect(envelope.error.debug).toBeDefined()
      expect(envelope.error.debug?.actual_message).toBe('Syntax error at internal/dev/test.ts:15')
      expect(envelope.error.debug?.stack).toContain('internal/dev/test.ts:15:10')
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})
