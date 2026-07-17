import { describe, it, expect } from 'vitest'
import { isEmail } from '../../src/utils/fileParsers'

describe('isEmail', () => {
  it('returns normalized email for valid addresses', () => {
    expect(isEmail('Alice@Test.COM')).toBe('alice@test.com')
    expect(isEmail('a.b@c.co')).toBe('a.b@c.co')
    expect(isEmail('user+tag@domain.org')).toBe('user+tag@domain.org')
  })

  it('returns null for null/undefined', () => {
    expect(isEmail(null)).toBeNull()
    expect(isEmail(undefined)).toBeNull()
  })

  it('returns null for empty/whitespace strings', () => {
    expect(isEmail('')).toBeNull()
    expect(isEmail('   ')).toBeNull()
  })

  it('returns null for strings without @', () => {
    expect(isEmail('notanemail')).toBeNull()
    expect(isEmail('missing@')).toBeNull()
    expect(isEmail('@missing')).toBeNull()
  })

  it('returns null for strings without domain', () => {
    expect(isEmail('user@')).toBeNull()
    expect(isEmail('user@.com')).toBeNull()
  })

  it('coerces non-string values', () => {
    expect(isEmail(42)).toBeNull()
    expect(isEmail({})).toBeNull()
  })
})
