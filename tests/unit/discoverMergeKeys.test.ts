import { describe, it, expect } from 'vitest'
import { discoverMergeKeys, buildExampleRow, STANDARD_COLUMNS, EXAMPLE_VALUE_MAP } from '../../src/utils/templateGenerator'
import type { ImportedRecipient } from '../../src/types'

describe('STANDARD_COLUMNS', () => {
  it('contains email, name, company', () => {
    expect(STANDARD_COLUMNS).toEqual(['email', 'name', 'company'])
  })
})

describe('EXAMPLE_VALUE_MAP', () => {
  it('has values for known keys', () => {
    expect(EXAMPLE_VALUE_MAP.job_title).toBe('Engineering Manager')
    expect(EXAMPLE_VALUE_MAP.industry).toBe('SaaS')
    expect(EXAMPLE_VALUE_MAP.first_name).toBe('Alex')
  })
})

describe('discoverMergeKeys', () => {
  it('returns empty when no recipients have variables', () => {
    expect(discoverMergeKeys([])).toEqual([])
    expect(discoverMergeKeys([{ email: 'a@b.com' }])).toEqual([])
  })

  it('collects unique keys across all recipients', () => {
    const recipients: ImportedRecipient[] = [
      { email: 'a@b.com', variables: { role: 'Eng', dept: 'Tech' } },
      { email: 'c@d.com', variables: { role: 'Des', location: 'NYC' } },
    ]
    expect(discoverMergeKeys(recipients)).toEqual(['dept', 'location', 'role'])
  })

  it('filters out standard column names (case-insensitive)', () => {
    const recipients: ImportedRecipient[] = [
      { email: 'a@b.com', variables: { Name: 'n', COMPANY: 'c', EMAIL: 'e', custom: 'v' } },
    ]
    expect(discoverMergeKeys(recipients)).toEqual(['custom'])
  })

  it('sorts alphabetically', () => {
    const recipients: ImportedRecipient[] = [
      { email: 'a@b.com', variables: { z: '1', a: '2', m: '3' } },
    ]
    expect(discoverMergeKeys(recipients)).toEqual(['a', 'm', 'z'])
  })
})

describe('buildExampleRow', () => {
  it('has standard columns with example values', () => {
    const row = buildExampleRow([])
    expect(row).toEqual({ email: 'alex@example.com', name: 'Alex Johnson', company: 'Acme Corp' })
  })

  it('adds known merge keys from EXAMPLE_VALUE_MAP', () => {
    const row = buildExampleRow(['job_title', 'industry'])
    expect(row.job_title).toBe('Engineering Manager')
    expect(row.industry).toBe('SaaS')
  })

  it('uses fallback for unknown merge keys', () => {
    const row = buildExampleRow(['obscure_field'])
    expect(row.obscure_field).toBe('[your_value]')
  })

  it('combines standard columns with merge keys in order', () => {
    const row = buildExampleRow(['a', 'b'])
    const keys = Object.keys(row)
    expect(keys[0]).toBe('email')
    expect(keys[1]).toBe('name')
    expect(keys[2]).toBe('company')
    expect(keys[3]).toBe('a')
    expect(keys[4]).toBe('b')
  })
})
