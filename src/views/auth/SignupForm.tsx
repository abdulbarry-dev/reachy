import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface SignupFormProps {
  submitting: boolean
  /** Server error from the store. */
  error: string | null
  onSubmit: (credentials: { email: string; password: string }) => void
}

export function SignupForm({ submitting, error, onSubmit }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (password !== confirm) {
      setLocalError("Passwords don't match")
      return
    }
    onSubmit({ email, password })
  }

  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-muted">Free forever. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthInput
          label="Email"
          icon="bi-envelope"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <AuthInput
          label="Password"
          icon="bi-lock"
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={setPassword}
          minLength={6}
          required
          autoComplete="new-password"
        />
        <AuthInput
          label="Confirm password"
          icon="bi-shield-lock"
          type="password"
          placeholder="Confirm your password"
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
        />

        <AnimatePresence>
          {(localError || error) && (
            <AuthAlert message={localError || error || ''} />
          )}
        </AnimatePresence>

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Create Account
        </button>

        <p className="auth-alt-text">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </form>
    </>
  )
}
