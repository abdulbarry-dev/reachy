import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { supabase } from '../../src/lib/supabase'
import { signUp, signIn, signOut, resetPassword, updatePassword } from '../../src/store/authSlice'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth async thunks (integration)', () => {
  describe('signUp', () => {
    it('calls supabase.auth.signUp with email and password', async () => {
      const mockUser = { id: 'u1' }
      const mockSession = { access_token: 'tok' }
      ;(supabase.auth.signUp as Mock).mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const result = (await signUp({ email: 'a@b.com', password: 'pw' })(vi.fn(), () => ({}), undefined)) as { payload: { user: unknown; session: unknown } }
      expect(result.payload).toEqual({ user: mockUser, session: mockSession })
      expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
    })

    it('returns rejected action on error', async () => {
      ;(supabase.auth.signUp as Mock).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Email taken' } })
      const result = (await signUp({ email: 'a@b.com', password: 'pw' })(vi.fn(), () => ({}), undefined)) as { error: { message: string } }
      expect(result.error.message).toContain('Email taken')
    })
  })

  describe('signIn', () => {
    it('calls signInWithPassword', async () => {
      const mockUser = { id: 'u1' }
      const mockSession = { access_token: 'tok' }
      ;(supabase.auth.signInWithPassword as Mock).mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const result = (await signIn({ email: 'a@b.com', password: 'pw' })(vi.fn(), () => ({}), undefined)) as { payload: { user: unknown } }
      expect(result.payload.user).toEqual(mockUser)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
    })
  })

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      ;(supabase.auth.signOut as Mock).mockResolvedValue({ error: null })
      await signOut()(vi.fn(), () => ({}), undefined)
      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })
  })

  describe('resetPassword', () => {
    it('calls resetPasswordForEmail with redirectTo', async () => {
      ;(supabase.auth.resetPasswordForEmail as Mock).mockResolvedValue({ error: null })
      await resetPassword('a@b.com')(vi.fn(), () => ({}), undefined)
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    })
  })

  describe('updatePassword', () => {
    it('calls supabase.auth.updateUser', async () => {
      ;(supabase.auth.updateUser as Mock).mockResolvedValue({ error: null })
      await updatePassword('newpw')(vi.fn(), () => ({}), undefined)
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpw' })
    })
  })
})
