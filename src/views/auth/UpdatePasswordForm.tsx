import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface UpdatePasswordFormProps {
  submitting: boolean
  error: string | null
  onSubmit: (password: string) => void
}

export function UpdatePasswordForm({ submitting, error, onSubmit }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">New password</h1>
        <p className="auth-muted">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthInput
          label="New password"
          icon="bi-lock"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={setPassword}
          minLength={6}
          required
          autoComplete="new-password"
        />

        <AnimatePresence>
          {error && <AuthAlert message={error} />}
        </AnimatePresence>

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Update Password
        </button>
      </form>
    </>
  )
}
