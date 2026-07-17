import { describe, it, expect } from 'vitest'
import reducer, { setUser, setSession, setAuthLoading, clearAuthError } from '../../src/store/authSlice'

describe('authSlice reducer', () => {
  const initial = { user: null, session: null, loading: true, error: null }

  it('returns initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initial)
  })

  describe('sync reducers', () => {
    it('setUser updates user', () => {
      const user = { id: 'u1' } as any
      expect(reducer(initial, setUser(user)).user).toEqual(user)
    })

    it('setSession updates session', () => {
      const session = { access_token: 'tok' } as any
      expect(reducer(initial, setSession(session)).session).toEqual(session)
    })

    it('setAuthLoading updates loading flag', () => {
      expect(reducer(initial, setAuthLoading(false)).loading).toBe(false)
    })

    it('clearAuthError clears the error', () => {
      expect(reducer({ ...initial, error: 'err' }, clearAuthError()).error).toBeNull()
    })
  })

  describe('signUp lifecycle', () => {
    it('pending', () => {
      const s = reducer(initial, { type: 'auth/signUp/pending' })
      expect(s.loading).toBe(true)
      expect(s.error).toBeNull()
    })

    it('fulfilled sets user + session', () => {
      const s = reducer(initial, { type: 'auth/signUp/fulfilled', payload: { user: { id: 'u1' }, session: { access_token: 't' } } } as any)
      expect(s.loading).toBe(false)
      expect(s.user).toBeDefined()
      expect(s.session).toBeDefined()
    })

    it('rejected sets error', () => {
      const s = reducer(initial, { type: 'auth/signUp/rejected', error: { message: 'taken' } } as any)
      expect(s.loading).toBe(false)
      expect(s.error).toBe('taken')
    })

    it('rejected fallback message', () => {
      const s = reducer(initial, { type: 'auth/signUp/rejected', error: {} } as any)
      expect(s.error).toBe('Sign up failed')
    })
  })

  describe('signIn lifecycle', () => {
    it('fulfilled', () => {
      const s = reducer(initial, { type: 'auth/signIn/fulfilled', payload: { user: { id: 'u1' }, session: { a: 'b' } } } as any)
      expect(s.user).toBeDefined()
    })

    it('rejected fallback', () => {
      const s = reducer(initial, { type: 'auth/signIn/rejected', error: {} } as any)
      expect(s.error).toBe('Sign in failed')
    })
  })

  describe('signOut lifecycle', () => {
    it('fulfilled clears user + session', () => {
      const loggedIn = { user: { id: 'u1' } as any, session: { a: 'b' } as any, loading: false, error: null }
      const s = reducer(loggedIn, { type: 'auth/signOut/fulfilled' })
      expect(s.user).toBeNull()
      expect(s.session).toBeNull()
      expect(s.loading).toBe(false)
    })

    it('rejected fallback', () => {
      const s = reducer(initial, { type: 'auth/signOut/rejected', error: {} } as any)
      expect(s.error).toBe('Sign out failed')
    })
  })

  describe('resetPassword lifecycle', () => {
    it('fulfilled clears loading', () => {
      const s = reducer({ ...initial, loading: true }, { type: 'auth/resetPassword/fulfilled' })
      expect(s.loading).toBe(false)
    })

    it('rejected fallback', () => {
      const s = reducer(initial, { type: 'auth/resetPassword/rejected', error: {} } as any)
      expect(s.error).toBe('Reset failed')
    })
  })

  describe('updatePassword lifecycle', () => {
    it('fulfilled clears loading', () => {
      const s = reducer({ ...initial, loading: true }, { type: 'auth/updatePassword/fulfilled' })
      expect(s.loading).toBe(false)
    })

    it('rejected fallback', () => {
      const s = reducer(initial, { type: 'auth/updatePassword/rejected', error: {} } as any)
      expect(s.error).toBe('Update failed')
    })
  })
})
