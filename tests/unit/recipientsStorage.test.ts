import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RECIPIENTS_STORAGE_KEY,
  loadRecipients,
  saveRecipients,
} from '../../src/store/recipientsStorage'
import type { ImportedRecipient } from '../../src/types'

function recipient(email: string): ImportedRecipient {
  return { email, name: `Name ${email}`, company: 'Acme' }
}

/** A Storage whose every access fails, like private mode or a full quota. */
function failingStorage(): Storage {
  return {
    getItem: vi.fn(() => {
      throw new Error('storage disabled')
    }),
    setItem: vi.fn(() => {
      throw new Error('quota exceeded')
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(() => null),
    length: 0,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('loadRecipients', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadRecipients()).toEqual([])
  })

  it('returns the stored list', () => {
    const stored = [recipient('a@b.com'), recipient('c@d.com')]
    localStorage.setItem(RECIPIENTS_STORAGE_KEY, JSON.stringify(stored))

    expect(loadRecipients()).toEqual(stored)
  })

  it('returns an empty list for malformed JSON', () => {
    localStorage.setItem(RECIPIENTS_STORAGE_KEY, 'broken{{{')
    expect(loadRecipients()).toEqual([])
  })

  it('ignores stored JSON that is not an array', () => {
    localStorage.setItem(RECIPIENTS_STORAGE_KEY, JSON.stringify({ items: [recipient('a@b.com')] }))
    expect(loadRecipients()).toEqual([])
  })

  it('returns an empty list when storage access throws', () => {
    expect(loadRecipients(failingStorage())).toEqual([])
  })

  it('returns an empty list when no storage is available', () => {
    expect(loadRecipients(null)).toEqual([])
  })
})

describe('saveRecipients', () => {
  it('writes the list as JSON', () => {
    saveRecipients([recipient('a@b.com')])
    expect(JSON.parse(localStorage.getItem(RECIPIENTS_STORAGE_KEY)!)).toEqual([recipient('a@b.com')])
  })

  it('writes an empty list rather than removing the key', () => {
    saveRecipients([])
    expect(localStorage.getItem(RECIPIENTS_STORAGE_KEY)).toBe('[]')
  })

  it('does not throw when the quota is exceeded', () => {
    expect(() => saveRecipients([recipient('a@b.com')], failingStorage())).not.toThrow()
  })

  it('does not throw when no storage is available', () => {
    expect(() => saveRecipients([recipient('a@b.com')], null)).not.toThrow()
  })
})
