import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import recipientsReducer, {
  addRecipient,
  addRecipients,
  clearRecipients,
  removeRecipients,
  setRecipients,
  updateRecipient,
} from '../../src/store/recipientsSlice'
import { createRecipientsPersistence } from '../../src/store/recipientsPersistence'
import { RECIPIENTS_STORAGE_KEY } from '../../src/store/recipientsStorage'
import type { ImportedRecipient } from '../../src/types'

function recipient(email: string): ImportedRecipient {
  return { email, name: `Name ${email}`, company: 'Acme' }
}

/** A store wired exactly like the app: slice + persistence listener. */
function makeStore() {
  return configureStore({
    reducer: { recipients: recipientsReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(createRecipientsPersistence().middleware),
  })
}

function persisted(): unknown {
  const raw = localStorage.getItem(RECIPIENTS_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

beforeEach(() => {
  localStorage.clear()
})

describe('recipientsSlice purity', () => {
  it('writes nothing to storage when the reducer runs alone', () => {
    recipientsReducer(undefined, setRecipients([recipient('a@b.com')]))
    expect(localStorage.getItem(RECIPIENTS_STORAGE_KEY)).toBeNull()
  })

  it('is deterministic: the same action on the same state yields equal state', () => {
    const state = { items: [recipient('a@b.com')] }
    const first = recipientsReducer(state, addRecipient(recipient('c@d.com')))
    const second = recipientsReducer(state, addRecipient(recipient('c@d.com')))

    expect(first).toEqual(second)
    expect(state.items).toHaveLength(1)
  })
})

describe('recipients persistence', () => {
  it('persists setRecipients', () => {
    const store = makeStore()
    store.dispatch(setRecipients([recipient('a@b.com')]))

    expect(persisted()).toEqual([recipient('a@b.com')])
  })

  it('persists addRecipients', () => {
    const store = makeStore()
    store.dispatch(addRecipients([recipient('a@b.com'), recipient('c@d.com')]))

    expect(persisted()).toHaveLength(2)
  })

  it('persists addRecipient', () => {
    const store = makeStore()
    store.dispatch(addRecipient(recipient('a@b.com')))

    expect(persisted()).toEqual([recipient('a@b.com')])
  })

  it('persists removeRecipients', () => {
    const store = makeStore()
    store.dispatch(addRecipients([recipient('a@b.com'), recipient('c@d.com')]))
    store.dispatch(removeRecipients(['a@b.com']))

    expect(persisted()).toEqual([recipient('c@d.com')])
  })

  it('persists updateRecipient', () => {
    const store = makeStore()
    store.dispatch(addRecipient(recipient('a@b.com')))
    store.dispatch(updateRecipient({ email: 'a@b.com', data: { name: 'Updated' } }))

    expect((persisted() as ImportedRecipient[])[0].name).toBe('Updated')
  })

  it('persists clearRecipients as an empty array', () => {
    const store = makeStore()
    store.dispatch(addRecipient(recipient('a@b.com')))
    store.dispatch(clearRecipients())

    expect(persisted()).toEqual([])
  })

  it('ignores actions from other slices', () => {
    const store = makeStore()
    store.dispatch({ type: 'auth/setUser', payload: { id: 'u1' } })

    expect(localStorage.getItem(RECIPIENTS_STORAGE_KEY)).toBeNull()
  })

  it('keeps the state change when storage throws', () => {
    const store = makeStore()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => store.dispatch(addRecipient(recipient('a@b.com')))).not.toThrow()
    expect(store.getState().recipients.items).toHaveLength(1)

    setItem.mockRestore()
  })
})
