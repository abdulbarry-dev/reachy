import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
}

export const signUp = createAsyncThunk('auth/signUp', async (payload: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  })
  if (error) throw new Error(error.message)
  return { user: data.user, session: data.session }
})

export const signIn = createAsyncThunk('auth/signIn', async (payload: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })
  if (error) throw new Error(error.message)
  return { user: data.user, session: data.session }
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
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.session = action.payload.session
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Sign up failed'
      })
      .addCase(signIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.session = action.payload.session
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Sign in failed'
      })
      .addCase(signOut.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.session = null
        state.loading = false
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Sign out failed'
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Reset failed'
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updatePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Update failed'
      })
  },
})

export const { setUser, setSession, setAuthLoading, clearAuthError } = authSlice.actions
export default authSlice.reducer
