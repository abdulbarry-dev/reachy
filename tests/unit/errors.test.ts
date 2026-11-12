import { describe, expect, it } from 'vitest'
import {
  ERROR_STATES,
  generateReferenceId,
  getErrorConfig,
  sanitizeError,
} from '../../src/lib/errors'

describe('errors mapping & security sanitization', () => {
  it('provides complete configurations for all standard HTTP error status codes', () => {
    const codes = [401, 403, 404, 419, 429, 500, 503] as const
    for (const code of codes) {
      const config = getErrorConfig(code)
      expect(config.statusCode).toBe(code)
      expect(config.title).toBeTruthy()
      expect(config.message).toBeTruthy()
      expect(config.badge).toContain(String(code))
      expect(config.primaryCta).toBeDefined()
      expect(config.primaryCta.label).toBeTruthy()
    }
  })

  it('generates a clean, cryptographically secure reference ID with prefix', () => {
    const ref1 = generateReferenceId()
    const ref2 = generateReferenceId()
    expect(ref1).toMatch(/^ref_[a-f0-9]{16}$/)
    expect(ref2).toMatch(/^ref_[a-f0-9]{16}$/)
    expect(ref1).not.toBe(ref2)
  })

  it('sanitizes unexpected 500 errors to generic message with zero stack or path leak', () => {
    const dangerousError = new Error('Database connection failed at postgres://user:secret@db.internal:5432/reachy in /var/www/reachy/server.ts:42')
    dangerousError.stack = 'Error: Database connection failed\n    at query (/var/www/reachy/server.ts:42:15)'

    const sanitized = sanitizeError(dangerousError)

    expect(sanitized.statusCode).toBe(500)
    expect(sanitized.title).toBe(ERROR_STATES[500].title)
    // Never expose database connection strings, passwords, or internal server paths
    expect(sanitized.message).toBe(ERROR_STATES[500].message)
    expect(sanitized.message).not.toContain('postgres://')
    expect(sanitized.message).not.toContain('/var/www/')
    expect(sanitized.message).not.toContain('secret')
    expect(sanitized.referenceId).toMatch(/^ref_[a-f0-9]{16}$/)
  })

  it('preserves Next.js server component digest as reference ID if present', () => {
    const nextError = Object.assign(new Error('Minified React error #130'), {
      digest: 'next_err_823491823',
    })

    const sanitized = sanitizeError(nextError)
    expect(sanitized.referenceId).toBe('next_err_823491823')
    expect(sanitized.message).toBe(ERROR_STATES[500].message)
  })

  it('allows operational messages when explicitly marked safe', () => {
    const safeError = {
      isOperational: true,
      statusCode: 429,
      message: 'Rate limit reached. Please wait 30 seconds before your next dispatch tick.',
    }

    const sanitized = sanitizeError(safeError)
    expect(sanitized.statusCode).toBe(429)
    expect(sanitized.message).toBe('Rate limit reached. Please wait 30 seconds before your next dispatch tick.')
  })

  it('prevents open redirect vulnerabilities by validating redirect paths', () => {
    const config401 = getErrorConfig(401)
    expect(config401.primaryCta.href).toBe('/login')
    expect(config401.primaryCta.href.startsWith('/')).toBe(true)
    expect(config401.primaryCta.href.startsWith('//')).toBe(false)
  })
})
