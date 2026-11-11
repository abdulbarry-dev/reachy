import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  /** The initial `getSession()` read has settled. Read by the router only. */
  bootstrapped: boolean
  /** A credential request is in flight. Read by the auth buttons only. */
  submitting: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  bootstrapped: false,
  submitting: false,
  error: null,
}

export const signUp = createAsyncThunk('auth/signUp', async (payload: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  })
  if (error) throw new Error(error.message)
  return { user: data.user }
})

export const signIn = createAsyncThunk('auth/signIn', async (payload: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })
  if (error) throw new Error(error.message)
  return { user: data.user }
})

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
})

export const resetPassword = createAsyncThunk('auth/resetPassword', async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(error.message)
})

export const updatePassword = createAsyncThunk('auth/updatePassword', async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
    },
    finishBootstrap(state) {
      state.bootstrapped = true
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.submitting = false
        state.user = action.payload.user
      })
      .addCase(signUp.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? 'Sign up failed'
      })
      .addCase(signIn.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.submitting = false
        state.user = action.payload.user
      })
      .addCase(signIn.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? 'Sign in failed'
      })
      .addCase(signOut.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.submitting = false
      })
      .addCase(signOut.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? 'Sign out failed'
      })
      .addCase(resetPassword.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.submitting = false
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? 'Reset failed'
      })
      .addCase(updatePassword.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.submitting = false
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? 'Update failed'
      })
  },
})

export const { setUser, finishBootstrap, clearAuthError } = authSlice.actions
export default authSlice.reducer
