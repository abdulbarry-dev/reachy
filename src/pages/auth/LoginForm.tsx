import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface LoginFormProps {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  submitting: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function LoginForm({ email, password, onEmailChange, onPasswordChange, submitting, error, onSubmit }: LoginFormProps) {
  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">Sign in</h1>
        <p className="auth-muted">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        <AuthInput label="Email" icon="bi-envelope" type="email" placeholder="you@example.com" value={email} onChange={onEmailChange} required autoComplete="email" />
        <AuthInput label="Password" icon="bi-lock" type="password" placeholder="Enter your password" value={password} onChange={onPasswordChange} required autoComplete="current-password" />

        <div className="auth-form-row">
          <Link to="/reset-password" className="auth-link-sm">Forgot password?</Link>
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
          <Link to="/signup" className="auth-link">Create one free</Link>
        </p>
      </form>
    </>
  )
}
