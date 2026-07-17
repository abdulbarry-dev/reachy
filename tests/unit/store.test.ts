import { describe, it, expect } from 'vitest'
import { store } from '../../src/store'

describe('Redux store', () => {
  it('has auth and recipients reducers', () => {
    const state = store.getState()
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('recipients')
  })

  it('auth starts loading', () => {
    expect(store.getState().auth).toMatchObject({ user: null, session: null, loading: true, error: null })
  })

  it('recipients starts empty', () => {
    expect(store.getState().recipients).toMatchObject({ items: [] })
  })
})
