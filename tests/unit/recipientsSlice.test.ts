import { describe, it, expect, beforeEach } from 'vitest'
import reducer, {
  setRecipients,
  addRecipients,
  addRecipient,
  removeRecipients,
  clearRecipients,
  updateRecipient,
} from '../../src/store/recipientsSlice'
import type { ImportedRecipient } from '../../src/types'

const STORAGE_KEY = 'reachy_recipients_v1'

function r(email: string, overrides?: Partial<ImportedRecipient>): ImportedRecipient {
  return { email, name: `Name ${email}`, company: 'Acme', ...overrides }
}

beforeEach(() => {
  localStorage.clear()
})

describe('recipientsSlice', () => {
  it('loads empty state when localStorage is empty', () => {
    expect(reducer(undefined, { type: 'unknown' }).items).toEqual([])
  })

  it('handles malformed localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'broken{{{')
    expect(reducer(undefined, { type: 'unknown' }).items).toEqual([])
  })

  it('setRecipients replaces items and dedupes by email', () => {
    const s = reducer(undefined, setRecipients([r('a@b.com'), r('A@b.com'), r('c@d.com')]))
    expect(s.items).toHaveLength(2)
    expect(s.items[0].email).toBe('a@b.com')
  })

  it('setRecipients persists to localStorage', () => {
    reducer(undefined, setRecipients([r('a@b.com')]))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1)
  })

  it('addRecipients appends and dedupes across old and new', () => {
    const initial = { items: [r('a@b.com')] }
    const s = reducer(initial, addRecipients([r('A@b.com'), r('c@d.com')]))
    expect(s.items).toHaveLength(2)
  })

  it('addRecipient normalizes email to lowercase', () => {
    const s = reducer(undefined, addRecipient(r('A@B.COM')))
    expect(s.items[0].email).toBe('a@b.com')
  })

  it('addRecipient skips duplicate', () => {
    const s = reducer({ items: [r('a@b.com')] }, addRecipient(r('a@b.com')))
    expect(s.items).toHaveLength(1)
  })

  it('removeRecipients is case-insensitive', () => {
    const initial = { items: [r('a@b.com'), r('c@d.com')] }
    const s = reducer(initial, removeRecipients(['A@B.COM']))
    expect(s.items).toHaveLength(1)
    expect(s.items[0].email).toBe('c@d.com')
  })

  it('removeRecipients removes multiple at once', () => {
    const initial = { items: [r('a@b.com'), r('c@d.com'), r('e@f.com')] }
    const s = reducer(initial, removeRecipients(['a@b.com', 'e@f.com']))
    expect(s.items).toHaveLength(1)
    expect(s.items[0].email).toBe('c@d.com')
  })

  it('clearRecipients empties array and saves to localStorage', () => {
    const s = reducer({ items: [r('a@b.com')] }, clearRecipients())
    expect(s.items).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('updateRecipient is case-insensitive', () => {
    const initial = { items: [r('a@b.com')] }
    const s = reducer(initial, updateRecipient({ email: 'A@B.COM', data: { name: 'Updated' } }))
    expect(s.items[0].name).toBe('Updated')
  })

  it('updateRecipient does nothing when email not found', () => {
    const initial = { items: [r('a@b.com')] }
    const s = reducer(initial, updateRecipient({ email: 'x@y.com', data: { name: 'Nope' } }))
    expect(s.items[0].name).toBe('Name a@b.com')
  })
})
