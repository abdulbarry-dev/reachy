import { describe, it, expect } from 'vitest'
import reducer, { clearAuthError, finishBootstrap, setUser } from '../../src/store/authSlice'

/**
 * Auth state holds two independent facts that used to share one `loading` bit:
 *
 * - `bootstrapped` — the initial session read has settled. Only the router
 *   cares, and it must not flip when someone submits a form.
 * - `submitting` — a credential request is in flight. Only the auth buttons
 *   care, and it must not block the router while the session is checked.
 */
describe('authSlice reducer', () => {
  const initial = { user: null, bootstrapped: false, submitting: false, error: null }

  it('returns initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initial)
  })

  it('does not carry a session copy', () => {
    expect(reducer(undefined, { type: 'unknown' })).not.toHaveProperty('session')
  })

  describe('sync reducers', () => {
    it('setUser updates the user', () => {
      const user = { id: 'u1' } as never
      expect(reducer(initial, setUser(user)).user).toEqual(user)
    })

    it('finishBootstrap marks the session read as settled', () => {
      expect(reducer(initial, finishBootstrap()).bootstrapped).toBe(true)
    })

    it('clearAuthError clears the error', () => {
      expect(reducer({ ...initial, error: 'err' }, clearAuthError()).error).toBeNull()
    })
  })

  describe('bootstrap and submission are independent', () => {
    it('a submission does not settle the bootstrap read', () => {
      const s = reducer(initial, { type: 'auth/signIn/pending' })

      expect(s.submitting).toBe(true)
      expect(s.bootstrapped).toBe(false)
    })

    it('a settled bootstrap does not make a submission look idle', () => {
      const s = reducer({ ...initial, bootstrapped: true }, { type: 'auth/signIn/pending' })

      expect(s.submitting).toBe(true)
      expect(s.bootstrapped).toBe(true)
    })
  })

  describe('signUp lifecycle', () => {
    it('pending marks the request in flight and clears the error', () => {
      const s = reducer({ ...initial, error: 'old' }, { type: 'auth/signUp/pending' })
      expect(s.submitting).toBe(true)
      expect(s.error).toBeNull()
    })

    it('fulfilled stores the user and ends the request', () => {
      const s = reducer(initial, {
        type: 'auth/signUp/fulfilled',
        payload: { user: { id: 'u1' } },
      } as never)
      expect(s.submitting).toBe(false)
      expect(s.user).toBeDefined()
    })

    it('rejected sets the error', () => {
      const s = reducer(initial, { type: 'auth/signUp/rejected', error: { message: 'taken' } } as never)
      expect(s.submitting).toBe(false)
      expect(s.error).toBe('taken')
    })

    it('rejected falls back to a generic message', () => {
      const s = reducer(initial, { type: 'auth/signUp/rejected', error: {} } as never)
      expect(s.error).toBe('Sign up failed')
    })
  })

  describe('signIn lifecycle', () => {
    it('fulfilled stores the user', () => {
      const s = reducer(initial, {
        type: 'auth/signIn/fulfilled',
        payload: { user: { id: 'u1' } },
      } as never)
      expect(s.user).toBeDefined()
      expect(s.submitting).toBe(false)
    })

    it('rejected falls back to a generic message', () => {
      const s = reducer(initial, { type: 'auth/signIn/rejected', error: {} } as never)
      expect(s.error).toBe('Sign in failed')
    })
  })

  describe('signOut lifecycle', () => {
    it('fulfilled clears the user', () => {
      const loggedIn = { user: { id: 'u1' } as never, bootstrapped: true, submitting: false, error: null }
      const s = reducer(loggedIn, { type: 'auth/signOut/fulfilled' })

      expect(s.user).toBeNull()
      expect(s.submitting).toBe(false)
    })

    it('rejected falls back to a generic message', () => {
      const s = reducer(initial, { type: 'auth/signOut/rejected', error: {} } as never)
      expect(s.error).toBe('Sign out failed')
    })
  })

  describe('resetPassword lifecycle', () => {
    it('fulfilled ends the request', () => {
      const s = reducer({ ...initial, submitting: true }, { type: 'auth/resetPassword/fulfilled' })
      expect(s.submitting).toBe(false)
    })

    it('rejected falls back to a generic message', () => {
      const s = reducer(initial, { type: 'auth/resetPassword/rejected', error: {} } as never)
      expect(s.error).toBe('Reset failed')
    })
  })

  describe('updatePassword lifecycle', () => {
    it('fulfilled ends the request', () => {
      const s = reducer({ ...initial, submitting: true }, { type: 'auth/updatePassword/fulfilled' })
      expect(s.submitting).toBe(false)
    })

    it('rejected falls back to a generic message', () => {
      const s = reducer(initial, { type: 'auth/updatePassword/rejected', error: {} } as never)
      expect(s.error).toBe('Update failed')
    })
  })
})
