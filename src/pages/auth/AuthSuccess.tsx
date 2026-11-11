import { motion } from 'framer-motion'
import { fadeUp } from './authMotion'

interface AuthSuccessProps {
  /** Bootstrap Icons class for the badge above the message. */
  icon: string
  title: string
  body: React.ReactNode
  cta: string
  onCta: () => void
}

/** Terminal screen for a flow that completed — confirm email, reset sent, done. */
export function AuthSuccess({ icon, title, body, cta, onCta }: AuthSuccessProps) {
  return (
    <motion.div className="auth-success-wrap" variants={fadeUp} initial="hidden" animate="visible">
      <div className="auth-success-icon">
        <i className={`bi ${icon}`} />
      </div>
      <h2 className="auth-heading mt-4 mb-2">{title}</h2>
      <p className="auth-muted text-center mb-5">{body}</p>
      <button className="auth-btn" onClick={onCta}>{cta}</button>
    </motion.div>
  )
}
