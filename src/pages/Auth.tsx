import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, submitting, error } = useSelector((state: RootState) => state.auth)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupDone, setSignupDone] = useState(false)
  const [localError, setLocalError] = useState('')

  const [resetEmail, setResetEmail] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetUpdated, setResetUpdated] = useState(false)
  const [callbackLoading, setCallbackLoading] = useState(false)

  const isResetCallback = mode === 'reset-password' && (searchParams.has('code') || window.location.hash.includes('access_token'))

  useEffect(() => {
    dispatch(clearAuthError())
    setLocalError('')
  }, [mode, dispatch])

  useEffect(() => {
    if (!isResetCallback) return
    const code = searchParams.get('code')
    if (code) {
      setCallbackLoading(true)
      supabase.auth.exchangeCodeForSession(code).catch(() => {}).finally(() => setCallbackLoading(false))
    }
  }, [isResetCallback, searchParams])

  if (user && !isResetCallback) return <Navigate to="/dashboard" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    setLocalError('')
    const result = await dispatch(signIn({ email: loginEmail, password: loginPassword }))
    if (signIn.fulfilled.match(result)) navigate('/dashboard', { replace: true })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    setLocalError('')
    if (signupPassword !== signupConfirm) { setLocalError("Passwords don't match"); return }
    const result = await dispatch(signUp({ email: signupEmail, password: signupPassword }))
    if (signUp.fulfilled.match(result)) setSignupDone(true)
  }

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(resetPassword(resetEmail))
    if (resetPassword.fulfilled.match(result)) setResetSent(true)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(updatePassword(resetNewPassword))
    if (updatePassword.fulfilled.match(result)) setResetUpdated(true)
  }

  const panel = panelConfig[mode]

  return (
    <AuthShell panel={panel}>
      <AnimatePresence mode="wait">
        {mode === 'login' && (
          <motion.div key="login" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <LoginForm
              email={loginEmail}
              password={loginPassword}
              onEmailChange={setLoginEmail}
              onPasswordChange={setLoginPassword}
              submitting={submitting}
              error={error}
              onSubmit={handleLogin}
            />
          </motion.div>
        )}

        {mode === 'signup' && !signupDone && (
          <motion.div key="signup" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <SignupForm
              email={signupEmail}
              password={signupPassword}
              confirm={signupConfirm}
              onEmailChange={setSignupEmail}
              onPasswordChange={setSignupPassword}
              onConfirmChange={setSignupConfirm}
              submitting={submitting}
              error={error}
              localError={localError}
              onSubmit={handleSignup}
            />
          </motion.div>
        )}

        {mode === 'signup' && signupDone && (
          <motion.div key="signup-done" variants={fadeIn} initial="hidden" animate="visible">
            <AuthSuccess
              icon="bi-envelope-check-fill"
              title="Check your inbox"
              body={<>We sent a confirmation link to <strong>{signupEmail}</strong>. Click it to activate your account.</>}
              cta="Back to Sign In"
              onCta={() => { setSignupDone(false); navigate('/login') }}
            />
          </motion.div>
        )}

        {mode === 'reset-password' && !isResetCallback && !resetSent && (
          <motion.div key="reset-send" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <ResetRequestForm
              email={resetEmail}
              onEmailChange={setResetEmail}
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
              body={<>A reset link was sent to <strong>{resetEmail}</strong>. Check your spam folder if you don't see it.</>}
              cta="Back to Sign In"
              onCta={() => navigate('/login')}
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
                password={resetNewPassword}
                onPasswordChange={setResetNewPassword}
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
              onCta={() => navigate('/login')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
