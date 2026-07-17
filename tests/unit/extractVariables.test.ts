import { describe, it, expect } from 'vitest'
import { extractVariables, normalizeString } from '../../src/utils/fileParsers'

describe('normalizeString', () => {
  it('returns trimmed string', () => {
    expect(normalizeString('  Hello  ')).toBe('Hello')
  })

  it('returns undefined for null/undefined', () => {
    expect(normalizeString(null)).toBeUndefined()
    expect(normalizeString(undefined)).toBeUndefined()
  })

  it('returns undefined for empty after trim', () => {
    expect(normalizeString('')).toBeUndefined()
    expect(normalizeString('   ')).toBeUndefined()
  })

  it('coerces numbers', () => {
    expect(normalizeString(42)).toBe('42')
  })
})

describe('extractVariables', () => {
  it('extracts non-standard keys', () => {
    const result = extractVariables({ email: 'a@b.com', name: 'A', company: 'C', job_title: 'Eng', department: 'Sales' })
    expect(result).toEqual({ job_title: 'Eng', department: 'Sales' })
  })

  it('normalizes keys to lowercase', () => {
    const result = extractVariables({ EMAIL: 'a@b.com', Job_Title: 'Eng', Department: 'Sales' })
    expect(result).toEqual({ job_title: 'Eng', department: 'Sales' })
  })

  it('returns undefined when only standard columns', () => {
    const result = extractVariables({ email: 'a@b.com', name: 'A', company: 'C' })
    expect(result).toBeUndefined()
  })

  it('skips null/undefined values', () => {
    const result = extractVariables({ email: 'a@b.com', extra: null, other: undefined, valid: 'yes' })
    expect(result).toEqual({ valid: 'yes' })
  })

  it('trims values', () => {
    const result = extractVariables({ email: 'a@b.com', role: '  Engineer  ' })
    expect(result).toEqual({ role: 'Engineer' })
  })
})
