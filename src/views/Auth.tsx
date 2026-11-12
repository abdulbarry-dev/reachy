'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Redirect } from '../components/Navigation'
import { signIn, signUp, resetPassword, updatePassword, clearAuthError } from '../store/authSlice'
import { supabase } from '../lib/supabase'
import { AuthShell } from './auth/AuthShell'
import { LoginForm } from './auth/LoginForm'
import { SignupForm } from './auth/SignupForm'
import { ResetRequestForm } from './auth/ResetRequestForm'
import { UpdatePasswordForm } from './auth/UpdatePasswordForm'
import { VerifyingLink } from './auth/VerifyingLink'
import { AuthSuccess } from './auth/AuthSuccess'
import { fadeUp, fadeIn } from './auth/authMotion'
import { panelConfig, type AuthMode } from './auth/panelConfig'
import type { RootState, AppDispatch } from '../store'

export function Auth({ mode }: { mode: AuthMode }) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, submitting, error } = useSelector((state: RootState) => state.auth)

  const [signupDone, setSignupDone] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetUpdated, setResetUpdated] = useState(false)

  const isResetCallback =
    mode === 'reset-password' &&
    (searchParams.has('code') ||
      (typeof window !== 'undefined' && window.location.hash.includes('access_token')))

  const [callbackLoading, setCallbackLoading] = useState(
    () => isResetCallback && Boolean(searchParams.get('code')),
  )

  useEffect(() => {
    return () => {
      dispatch(clearAuthError())
    }
  }, [mode, dispatch])

  useEffect(() => {
    if (!isResetCallback) return
    const code = searchParams.get('code')
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .catch(() => {})
        .finally(() => setCallbackLoading(false))
    }
  }, [isResetCallback, searchParams])

  if (user && !isResetCallback) return <Redirect to="/dashboard" />

  const handleLogin = async (credentials: { email: string; password: string }) => {
    dispatch(clearAuthError())
    const result = await dispatch(signIn(credentials))
    if (signIn.fulfilled.match(result)) {
      router.replace('/dashboard')
    }
  }

  const handleSignup = async (credentials: { email: string; password: string }) => {
    dispatch(clearAuthError())
    const result = await dispatch(signUp(credentials))
    if (signUp.fulfilled.match(result)) {
      setSignupEmail(credentials.email)
      setSignupDone(true)
    }
  }

  const handleSendReset = async (email: string) => {
    dispatch(clearAuthError())
    const result = await dispatch(resetPassword(email))
    if (resetPassword.fulfilled.match(result)) {
      setResetEmail(email)
      setResetSent(true)
    }
  }

  const handleUpdatePassword = async (password: string) => {
    dispatch(clearAuthError())
    const result = await dispatch(updatePassword(password))
    if (updatePassword.fulfilled.match(result)) {
      setResetUpdated(true)
    }
  }

  const panel = panelConfig[mode]

  return (
    <AuthShell panel={panel}>
      <AnimatePresence mode="wait">
        {mode === 'login' && (
          <motion.div key="login" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <LoginForm
              submitting={submitting}
              error={error}
              onSubmit={handleLogin}
            />
          </motion.div>
        )}

        {mode === 'signup' && !signupDone && (
          <motion.div key="signup" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <SignupForm
              submitting={submitting}
              error={error}
              onSubmit={handleSignup}
            />
          </motion.div>
        )}

        {mode === 'signup' && signupDone && (
          <motion.div key="signup-done" variants={fadeIn} initial="hidden" animate="visible">
            <AuthSuccess
              icon="bi-envelope-check-fill"
              title="Check your inbox"
              body={
                <>
                  We sent a confirmation link to <strong>{signupEmail}</strong>. Click it to activate
                  your account.
                </>
              }
              cta="Back to Sign In"
              onCta={() => {
                setSignupDone(false)
                router.push('/login')
              }}
            />
          </motion.div>
        )}

        {mode === 'reset-password' && !isResetCallback && !resetSent && (
          <motion.div key="reset-send" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <ResetRequestForm
              submitting={submitting}
              error={error}
              onSubmit={handleSendReset}
            />
          </motion.div>
        )}

        {mode === 'reset-password' && !isResetCallback && resetSent && (
          <motion.div key="reset-sent" variants={fadeIn} initial="hidden" animate="visible">
            <AuthSuccess
              icon="bi-envelope-check-fill"
              title="Email sent!"
              body={
                <>
                  A reset link was sent to <strong>{resetEmail}</strong>. Check your spam folder if
                  you don't see it.
                </>
              }
              cta="Back to Sign In"
              onCta={() => router.push('/login')}
            />
          </motion.div>
        )}

        {mode === 'reset-password' && isResetCallback && !resetUpdated && (
          callbackLoading || !user ? (
            <motion.div key="reset-verifying" variants={fadeIn} initial="hidden" animate="visible">
              <VerifyingLink />
            </motion.div>
          ) : (
            <motion.div key="reset-new-pw" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
              <UpdatePasswordForm
                submitting={submitting}
                error={error}
                onSubmit={handleUpdatePassword}
              />
            </motion.div>
          )
        )}

        {mode === 'reset-password' && resetUpdated && (
          <motion.div key="reset-done" variants={fadeIn} initial="hidden" animate="visible">
            <AuthSuccess
              icon="bi-check-circle-fill"
              title="Password updated"
              body="Your password has been changed successfully. You can now sign in with your new credentials."
              cta="Go to Sign In"
              onCta={() => router.push('/login')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
