import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface ResetRequestFormProps {
  email: string
  onEmailChange: (value: string) => void
  submitting: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function ResetRequestForm({ email, onEmailChange, submitting, error, onSubmit }: ResetRequestFormProps) {
  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Reset password</h1>
        <p className="auth-muted">We'll send a recovery link to your email.</p>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        <AuthInput label="Email" icon="bi-envelope" type="email" placeholder="you@example.com" value={email} onChange={onEmailChange} required autoComplete="email" />

        <AnimatePresence>
          {error && <AuthAlert message={error} />}
        </AnimatePresence>

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Send Reset Link
        </button>

        <p className="auth-alt-text">
          <Link to="/login" className="auth-link">
            <i className="bi bi-arrow-left me-1" />Back to sign in
          </Link>
        </p>
      </form>
    </>
  )
}
