import { AnimatePresence } from 'framer-motion'
import { AuthInput } from './AuthInput'
import { AuthAlert } from './AuthAlert'

interface UpdatePasswordFormProps {
  password: string
  onPasswordChange: (value: string) => void
  submitting: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function UpdatePasswordForm({ password, onPasswordChange, submitting, error, onSubmit }: UpdatePasswordFormProps) {
  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-heading">New password</h1>
        <p className="auth-muted">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        <AuthInput label="New password" icon="bi-lock" type="password" placeholder="Enter new password" value={password} onChange={onPasswordChange} minLength={6} required autoComplete="new-password" />

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
