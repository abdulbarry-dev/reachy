import { describe, it, expect } from 'vitest'
import reducer, {
  setRecipients,
  addRecipients,
  addRecipient,
  removeRecipients,
  clearRecipients,
  updateRecipient,
} from '../../src/store/recipientsSlice'
import type { ImportedRecipient } from '../../src/types'

function r(email: string, overrides?: Partial<ImportedRecipient>): ImportedRecipient {
  return { email, name: `Name ${email}`, company: 'Acme', ...overrides }
}

/**
 * The slice is a pure state machine. Loading from and saving to `localStorage`
 * is the job of `recipientsStorage` and the persistence listener, tested in
 * `recipientsStorage.test.ts` and `recipientsPersistence.test.ts`.
 */
describe('recipientsSlice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: 'unknown' }).items).toEqual([])
  })

  it('setRecipients replaces items and dedupes by email', () => {
    const s = reducer(undefined, setRecipients([r('a@b.com'), r('A@b.com'), r('c@d.com')]))
    expect(s.items).toHaveLength(2)
    expect(s.items[0].email).toBe('a@b.com')
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

  it('clearRecipients empties the list', () => {
    const s = reducer({ items: [r('a@b.com')] }, clearRecipients())
    expect(s.items).toEqual([])
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

  it('does not mutate the previous state', () => {
    const initial = { items: [r('a@b.com')] }
    const s = reducer(initial, addRecipient(r('c@d.com')))
    expect(s).not.toBe(initial)
    expect(initial.items).toHaveLength(1)
  })
})
