import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface LoginFormProps {
  submitting: boolean
  error: string | null
  onSubmit: (credentials: { email: string; password: string }) => void
}

export function LoginForm({ submitting, error, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Sign in</h1>
        <p className="auth-muted">Enter your credentials to continue.</p>
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
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        <div className="auth-form-row">
          <Link href="/reset-password" className="auth-link-sm">
            Forgot password?
          </Link>
        </div>

        <AnimatePresence>
          {error && <AuthAlert message={error} />}
        </AnimatePresence>

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Sign In
        </button>

        <p className="auth-alt-text">
          Don't have an account?{' '}
          <Link href="/signup" className="auth-link">
            Create one free
          </Link>
        </p>
      </form>
    </>
  )
}
