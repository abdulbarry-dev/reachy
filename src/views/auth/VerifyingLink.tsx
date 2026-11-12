/**
 * Shown while a recovery link's code is being exchanged for a session.
 *
 * The heading and the spinner are one block, so a screen reader announces the
 * state rather than reading a bare "Loading".
 */
export function VerifyingLink() {
  return (
    <div className="auth-card-header text-center">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Verifying recovery link</span>
      </div>
      <h1 className="auth-heading">Verifying recovery link</h1>
      <p className="auth-muted">Please wait while we verify your reset link.</p>
    </div>
  )
}
