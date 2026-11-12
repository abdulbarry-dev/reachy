import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface ResetRequestFormProps {
  submitting: boolean
  error: string | null
  onSubmit: (email: string) => void
}

export function ResetRequestForm({ submitting, error, onSubmit }: ResetRequestFormProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(email)
  }

  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Reset password</h1>
        <p className="auth-muted">We'll send a recovery link to your email.</p>
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

        <AnimatePresence>
          {error && <AuthAlert message={error} />}
        </AnimatePresence>

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Send Reset Link
        </button>

        <p className="auth-alt-text">
          <Link href="/login" className="auth-link">
            <i className="bi bi-arrow-left me-1" />
            Back to sign in
          </Link>
        </p>
      </form>
    </>
  )
}
