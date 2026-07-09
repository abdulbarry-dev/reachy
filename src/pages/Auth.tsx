import { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUp, resetPassword, updatePassword, clearAuthError } from '../store/authSlice'
import type { RootState, AppDispatch } from '../store'

// ─── Motion Presets (aligned with LandingPage) ───────────────────────────────
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT_EXPO } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }
}

const fadeIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.25 } }
}

// ─── Shared SVG Logo ─────────────────────────────────────────────────────────
function LogoSvg({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 340 350" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0.000000,350.000000) scale(0.100000,-0.100000)" fill="currentColor">
        <path d="M511 3255 c-82 -187 -117 -386 -108 -623 8 -224 65 -406 173 -553 44 -61 163 -172 214 -201 22 -13 40 -25 40 -28 0 -3 -35 -13 -77 -23 -200 -45 -406 -177 -526 -337 -43 -57 -147 -247 -147 -269 0 -7 30 -11 83 -11 107 0 252 -22 352 -54 108 -34 253 -118 332 -191 61 -56 66 -64 70 -111 6 -55 -9 -94 -54 -148 -56 -68 -186 -147 -322 -196 -94 -35 -93 -36 -61 75 30 107 94 227 156 294 l55 59 -28 20 c-43 30 -90 52 -110 52 -36 0 -135 -126 -178 -226 -28 -65 -65 -175 -79 -239 -19 -81 -40 -254 -32 -262 10 -10 155 15 253 43 48 14 138 49 198 78 171 82 276 171 331 279 14 26 29 45 34 42 5 -3 26 -35 46 -71 55 -99 93 -228 112 -386 13 -114 19 -137 31 -133 43 17 207 123 267 173 133 112 248 281 303 448 20 60 35 141 46 256 l6 56 77 58 c105 80 301 271 377 369 156 200 260 407 330 660 37 131 64 184 121 234 50 44 107 65 206 77 32 3 58 10 58 14 0 18 -68 96 -110 127 -57 40 -72 55 -121 121 -45 59 -106 102 -183 129 -66 23 -207 22 -296 -1 -244 -65 -545 -188 -684 -281 l-53 -35 -109 66 c-60 36 -154 88 -209 116 -162 82 -254 136 -361 214 -136 99 -237 200 -313 314 -35 52 -64 96 -66 98 -1 1 -21 -40 -44 -93z m174 -333 c112 -106 266 -207 540 -353 382 -204 489 -298 563 -498 20 -53 26 -91 30 -197 7 -191 -22 -318 -99 -432 l-31 -45 34 29 c50 43 118 126 159 195 48 79 79 175 89 278 l9 85 102 102 102 103 46 -39 c25 -22 47 -38 49 -36 3 4 72 305 72 317 0 7 -309 -68 -319 -78 -3 -2 14 -23 37 -46 l42 -43 -79 -78 c-43 -43 -81 -74 -83 -70 -3 5 -11 27 -18 49 -18 57 -55 120 -118 199 -64 80 -68 70 57 134 165 86 485 196 602 209 31 3 72 3 91 -1 50 -9 121 -59 153 -108 l28 -42 -24 -15 c-102 -66 -148 -145 -211 -359 -49 -167 -98 -283 -172 -407 -198 -331 -526 -605 -1001 -837 l-148 -72 -34 40 c-19 21 -46 54 -60 72 l-26 33 100 102 c117 119 156 176 185 270 52 173 -14 357 -167 464 l-29 21 59 78 c33 44 114 136 182 205 l123 126 -53 26 c-108 54 -98 56 -189 -31 -70 -67 -185 -202 -254 -298 l-21 -29 -81 49 c-122 74 -214 171 -267 281 -41 87 -59 135 -48 135 3 0 32 -25 66 -55 42 -38 99 -74 182 -115 170 -83 155 -83 187 4 l26 74 -71 32 c-103 47 -228 132 -281 191 -55 62 -112 173 -127 251 -11 53 -5 208 8 208 3 0 42 -35 88 -78z m434 -1238 c22 -19 49 -54 60 -78 28 -57 28 -155 1 -215 -20 -42 -194 -231 -233 -253 -15 -8 -30 -2 -73 26 -30 20 -54 43 -54 51 0 36 165 386 228 483 19 29 25 28 71 -14z m-279 -9 c0 -3 -19 -42 -42 -88 -23 -45 -63 -131 -89 -192 -26 -60 -51 -109 -56 -107 -4 1 -41 13 -81 27 -40 14 -106 31 -147 38 -41 6 -75 15 -75 19 0 4 28 37 61 73 95 101 218 177 354 216 68 20 75 21 75 14z m851 -826 c-38 -150 -138 -313 -247 -401 -48 -39 -64 -41 -64 -6 0 28 -67 227 -87 257 -12 18 -13 26 -4 29 27 9 320 161 366 190 28 17 51 27 53 22 2 -5 -6 -46 -17 -91z"/>
      </g>
    </svg>
  )
}

// ─── Field Input Component ────────────────────────────────────────────────────
interface AuthInputProps {
  icon: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  minLength?: number
  required?: boolean
  autoComplete?: string
}
function AuthInput({ icon, type, placeholder, value, onChange, minLength, required, autoComplete }: AuthInputProps) {
  return (
    <div className="auth2-input-wrap">
      <i className={`bi ${icon} auth2-input-icon`} />
      <Form.Label htmlFor={placeholder} className="visually-hidden">{placeholder}</Form.Label>
      <Form.Control
        id={placeholder}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth2-input"
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  )
}

// ─── Error / Alert Banner ─────────────────────────────────────────────────────
function AuthAlert({ message }: { message: string }) {
  return (
    <motion.div
      className="auth2-alert"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <i className="bi bi-exclamation-circle-fill" /> {message}
    </motion.div>
  )
}

// ─── Success State ────────────────────────────────────────────────────────────
function AuthSuccess({ icon, title, body, cta, onCta }: {
  icon: string; title: string; body: React.ReactNode
  cta: string; onCta: () => void
}) {
  return (
    <motion.div className="auth2-success-wrap" variants={fadeUp} initial="hidden" animate="visible">
      <div className="auth2-success-icon">
        <i className={`bi ${icon}`} />
      </div>
      <h2 className="auth2-heading mt-4 mb-2">{title}</h2>
      <p className="auth2-muted text-center mb-5">{body}</p>
      <button className="auth2-btn" onClick={onCta}>{cta}</button>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Auth({ mode }: { mode: 'login' | 'signup' | 'reset-password' }) {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading, error } = useSelector((state: RootState) => state.auth)

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

  const isResetCallback = mode === 'reset-password' && (searchParams.has('code') || window.location.hash.includes('access_token'))

  useEffect(() => {
    dispatch(clearAuthError())
    setLocalError('')
  }, [mode, dispatch])

  if (user) return <Navigate to="/dashboard" replace />

  // ── Handlers ──
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

  // ── Side panel config per mode ──
  const panelConfig = {
    login: {
      tag: 'Welcome back',
      headline: 'Sign in to your campaigns',
      sub: 'Your outreach pipeline is waiting. Log in to monitor deliverability and dispatch status.',
      stat1: { num: '99%', label: 'Inbox placement rate' },
      stat2: { num: '90', label: 'Safe daily cap' },
      altText: "Don't have an account?",
      altLink: '/signup',
      altLabel: 'Create one',
    },
    signup: {
      tag: 'Get started free',
      headline: 'Automate cold outreach without the spam risk',
      sub: 'Connect Gmail, upload your CSV, and let pg_cron handle cadenced dispatch — all from a single dashboard.',
      stat1: { num: '60s', label: 'Throttle between sends' },
      stat2: { num: '0', label: 'Plaintext secrets stored' },
      altText: 'Already have an account?',
      altLink: '/login',
      altLabel: 'Sign in',
    },
    'reset-password': {
      tag: 'Account recovery',
      headline: 'Regain access in seconds',
      sub: 'Enter the email linked to your account and we\'ll send a secure reset link straight to your inbox.',
      stat1: { num: 'bi-shield-lock-fill', label: 'End-to-end secure' },
      stat2: { num: 'bi-envelope-fill', label: 'Reset via email link' },
      altText: 'Remember your password?',
      altLink: '/login',
      altLabel: 'Sign in',
    },
  }
  const panel = panelConfig[mode]

  return (
    <div className="auth2-root">
      {/* Background blobs — same as LandingPage */}
      <div className="auth2-blob auth2-blob-1" />
      <div className="auth2-blob auth2-blob-2" />

      {/* ── Left branded side panel ── */}
      <motion.aside
        className="auth2-side"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      >
        {/* Back to home */}
        <Link to="/" className="auth2-back-link">
          <i className="bi bi-arrow-left" /> Back to home
        </Link>

        <div className="auth2-side-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.65, ease: EASE_OUT_EXPO }}
          >
            {/* Brand mark */}
            <div className="auth2-side-brand">
              <div className="auth2-side-logo">
                <LogoSvg size={22} />
              </div>
              <span>Reachy</span>
            </div>

            <div className="auth2-side-tag">{panel.tag}</div>
            <h2 className="auth2-side-headline">{panel.headline}</h2>
            <p className="auth2-side-sub">{panel.sub}</p>

            {/* Stats row */}
            <div className="auth2-side-stats">
              <div className="auth2-side-stat">
                <div className="auth2-side-stat-num">{panel.stat1.num.startsWith('bi-') ? <i className={`bi ${panel.stat1.num}`}></i> : panel.stat1.num}</div>
                <div className="auth2-side-stat-label">{panel.stat1.label}</div>
              </div>
              <div className="auth2-side-stat-divider" />
              <div className="auth2-side-stat">
                <div className="auth2-side-stat-num">{panel.stat2.num.startsWith('bi-') ? <i className={`bi ${panel.stat2.num}`}></i> : panel.stat2.num}</div>
                <div className="auth2-side-stat-label">{panel.stat2.label}</div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="auth2-side-badges">
              <div className="auth2-side-badge"><i className="bi bi-shield-check" /> Vault-encrypted secrets</div>
              <div className="auth2-side-badge"><i className="bi bi-clock-history" /> pg_cron scheduling</div>
              <div className="auth2-side-badge"><i className="bi bi-google" /> Gmail SMTP</div>
            </div>
          </motion.div>
        </div>

        {/* Alt action (mobile bottom of side) */}
        <div className="auth2-side-alt">
          {panel.altText}{' '}
          <Link to={panel.altLink} className="auth2-side-alt-link">{panel.altLabel}</Link>
        </div>
      </motion.aside>

      {/* ── Right form panel ── */}
      <main className="auth2-main">
        {/* Mobile header bar (hidden on desktop) */}
        <div className="auth2-mobile-header d-lg-none">
          <Link to="/" className="auth2-mobile-back" aria-label="Back to home">
            <i className="bi bi-arrow-left" />
          </Link>
          <div className="auth2-mobile-tag">{panel.tag}</div>
        </div>

        <motion.div
          className="auth2-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_OUT_EXPO }}
        >
          {/* Mobile brand logo (hidden on desktop) */}
          <div className="auth2-card-brand d-lg-none">
            <LogoSvg size={24} />
            <span>Reachy</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ════ LOGIN ════ */}
            {mode === 'login' && (
              <motion.div key="login" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div className="auth2-card-header">
                  <h1 className="auth2-heading">Sign in</h1>
                  <p className="auth2-muted">Welcome back — enter your credentials below.</p>
                </div>

                <form onSubmit={handleLogin} className="auth2-form">
                  <AuthInput icon="bi-envelope" type="email" placeholder="Email address" value={loginEmail} onChange={setLoginEmail} required autoComplete="email" />
                  <AuthInput icon="bi-lock" type="password" placeholder="Password" value={loginPassword} onChange={setLoginPassword} required autoComplete="current-password" />

                  <div className="auth2-form-row">
                    <Link to="/reset-password" className="auth2-link-sm">Forgot password?</Link>
                  </div>

                  <AnimatePresence>
                    {error && mode === 'login' && <AuthAlert message={error} />}
                  </AnimatePresence>

                  <button type="submit" className="auth2-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Sign In <i className="bi bi-arrow-right ms-1" />
                  </button>

                  <div className="auth2-divider"><span>or</span></div>
                  <p className="auth2-alt-text">
                    Don't have an account?{' '}
                    <Link to="/signup" className="auth2-link">Create one free</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ════ SIGNUP ════ */}
            {mode === 'signup' && !signupDone && (
              <motion.div key="signup" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div className="auth2-card-header">
                  <h1 className="auth2-heading">Create account</h1>
                  <p className="auth2-muted">Free forever. No credit card required.</p>
                </div>

                <form onSubmit={handleSignup} className="auth2-form">
                  <AuthInput icon="bi-envelope" type="email" placeholder="Email address" value={signupEmail} onChange={setSignupEmail} required autoComplete="email" />
                  <AuthInput icon="bi-lock" type="password" placeholder="Password" value={signupPassword} onChange={setSignupPassword} minLength={6} required autoComplete="new-password" />
                  <AuthInput icon="bi-shield-lock" type="password" placeholder="Confirm password" value={signupConfirm} onChange={setSignupConfirm} required autoComplete="new-password" />

                  <AnimatePresence>
                    {(localError || (error && mode === 'signup')) && (
                      <AuthAlert message={localError || error || ''} />
                    )}
                  </AnimatePresence>

                  <button type="submit" className="auth2-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Create Account <i className="bi bi-arrow-right ms-1" />
                  </button>

                  <div className="auth2-divider"><span>or</span></div>
                  <p className="auth2-alt-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth2-link">Sign in</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ════ SIGNUP SUCCESS ════ */}
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

            {/* ════ RESET — send link ════ */}
            {mode === 'reset-password' && !isResetCallback && !resetSent && (
              <motion.div key="reset-send" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div className="auth2-card-header">
                  <h1 className="auth2-heading">Reset password</h1>
                  <p className="auth2-muted">Enter your email and we'll send a secure recovery link.</p>
                </div>

                <form onSubmit={handleSendReset} className="auth2-form">
                  <AuthInput icon="bi-envelope" type="email" placeholder="Email address" value={resetEmail} onChange={setResetEmail} required autoComplete="email" />

                  <AnimatePresence>
                    {error && mode === 'reset-password' && <AuthAlert message={error} />}
                  </AnimatePresence>

                  <button type="submit" className="auth2-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Send Reset Link <i className="bi bi-send ms-1" />
                  </button>

                  <div className="auth2-divider"><span>or</span></div>
                  <p className="auth2-alt-text">
                    <Link to="/login" className="auth2-link">
                      <i className="bi bi-arrow-left me-1" />Back to sign in
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ════ RESET — link sent ════ */}
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

            {/* ════ RESET — set new password ════ */}
            {mode === 'reset-password' && isResetCallback && !resetUpdated && (
              <motion.div key="reset-new-pw" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div className="auth2-card-header">
                  <h1 className="auth2-heading">New password</h1>
                  <p className="auth2-muted">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="auth2-form">
                  <AuthInput icon="bi-lock" type="password" placeholder="New password" value={resetNewPassword} onChange={setResetNewPassword} minLength={6} required autoComplete="new-password" />

                  <AnimatePresence>
                    {error && mode === 'reset-password' && <AuthAlert message={error} />}
                  </AnimatePresence>

                  <button type="submit" className="auth2-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Update Password <i className="bi bi-check2 ms-1" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ════ RESET — updated ════ */}
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
        </motion.div>

        {/* Mobile trust bar (hidden on desktop) */}
        <div className="auth2-mobile-trust d-lg-none">
          <div className="auth2-mobile-trust-item"><i className="bi bi-shield-check" /> Vault-encrypted</div>
          <div className="auth2-mobile-trust-item"><i className="bi bi-clock-history" /> pg_cron</div>
          <div className="auth2-mobile-trust-item"><i className="bi bi-google" /> Gmail SMTP</div>
        </div>

        {/* Footer note */}
        <motion.p
          className="auth2-footer-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          By continuing you agree to our{' '}
          <Link to="/" className="auth2-link-sm">Terms</Link>{' '}and{' '}
          <Link to="/" className="auth2-link-sm">Privacy Policy</Link>.
        </motion.p>
      </main>
    </div>
  )
}
