import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LogoSvg } from './LogoSvg'
import { easeOut } from './authMotion'
import type { PanelCopy } from './panelConfig'
import type { ReactNode } from 'react'

interface AuthShellProps {
  panel: PanelCopy
  /** The animated card body for the current screen. */
  children: ReactNode
}

/**
 * Two-column auth chrome: the marketing panel, the phone-only bars, the card
 * frame and the legal footer.
 *
 * Screens differ only in what goes inside the card, so the frame is shared
 * once instead of being repeated around each of the six card states.
 */
export function AuthShell({ panel, children }: AuthShellProps) {
  return (
    <div className="auth-root">
      <motion.aside
        className="auth-side"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        <Link to="/" className="auth-back-link">
          <i className="bi bi-arrow-left" /> Back to home
        </Link>

        <div className="auth-side-content">
          <div className="auth-side-brand">
            <LogoSvg size={22} />
            <span>Reachy</span>
          </div>

          <div className="auth-side-tag">{panel.tag}</div>
          <h2 className="auth-side-headline">{panel.headline}</h2>
          <p className="auth-side-sub">{panel.sub}</p>
        </div>

        <div className="auth-side-alt">
          {panel.altText}{' '}
          <Link to={panel.altLink} className="auth-side-alt-link">{panel.altLabel}</Link>
        </div>
      </motion.aside>

      <main className="auth-main">
        <div className="auth-mobile-header d-lg-none">
          <Link to="/" className="auth-mobile-back" aria-label="Back to home">
            <i className="bi bi-arrow-left" />
          </Link>
          <div className="auth-mobile-tag">{panel.tag}</div>
        </div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        >
          <div className="auth-card-brand d-lg-none">
            <LogoSvg size={22} />
            <span>Reachy</span>
          </div>

          {children}
        </motion.div>

        <motion.p
          className="auth-footer-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          By continuing you agree to our{' '}
          <Link to="/" className="auth-link-sm">Terms</Link>{' '}and{' '}
          <Link to="/" className="auth-link-sm">Privacy Policy</Link>.
        </motion.p>
      </main>
    </div>
  )
}
