import { beforeEach, describe, expect, it, vi } from 'vitest'
import { store } from '../../src/store'
import { RECIPIENTS_STORAGE_KEY } from '../../src/store/recipientsStorage'
import { addRecipient } from '../../src/store/recipientsSlice'

beforeEach(() => {
  localStorage.clear()
})

describe('Redux store', () => {
  it('has auth and recipients reducers', () => {
    const state = store.getState()
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('recipients')
  })

  it('auth starts without a user and with the bootstrap read pending', () => {
    expect(store.getState().auth).toEqual({
      user: null,
      bootstrapped: false,
      submitting: false,
      error: null,
    })
  })

  it('recipients starts empty when nothing is stored', () => {
    expect(store.getState().recipients).toMatchObject({ items: [] })
  })

  it('hydrates recipients from storage at boot', async () => {
    localStorage.setItem(
      RECIPIENTS_STORAGE_KEY,
      JSON.stringify([{ email: 'stored@example.com', name: 'Stored', company: 'Acme' }]),
    )
    vi.resetModules()

    const { store: freshStore } = await import('../../src/store')

    expect(freshStore.getState().recipients.items).toEqual([
      { email: 'stored@example.com', name: 'Stored', company: 'Acme' },
    ])
  })

  it('persists recipients through the listener middleware', () => {
    store.dispatch(addRecipient({ email: 'persisted@example.com', name: 'P', company: 'Acme' }))

    expect(JSON.parse(localStorage.getItem(RECIPIENTS_STORAGE_KEY)!)).toEqual([
      { email: 'persisted@example.com', name: 'P', company: 'Acme' },
    ])
  })
})
