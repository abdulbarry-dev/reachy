import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface SignupFormProps {
  email: string
  password: string
  confirm: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmChange: (value: string) => void
  submitting: boolean
  /** Server error from the store. */
  error: string | null
  /** Client-side error, e.g. the two passwords not matching. */
  localError: string
  onSubmit: (e: React.FormEvent) => void
}

export function SignupForm({
  email,
  password,
  confirm,
  onEmailChange,
  onPasswordChange,
  onConfirmChange,
  submitting,
  error,
  localError,
  onSubmit,
}: SignupFormProps) {
  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-muted">Free forever. No credit card required.</p>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        <AuthInput label="Email" icon="bi-envelope" type="email" placeholder="you@example.com" value={email} onChange={onEmailChange} required autoComplete="email" />
        <AuthInput label="Password" icon="bi-lock" type="password" placeholder="Choose a password" value={password} onChange={onPasswordChange} minLength={6} required autoComplete="new-password" />
        <AuthInput label="Confirm password" icon="bi-shield-lock" type="password" placeholder="Confirm your password" value={confirm} onChange={onConfirmChange} required autoComplete="new-password" />

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
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </form>
    </>
  )
}
