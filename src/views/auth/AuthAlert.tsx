import { motion } from 'framer-motion'

/** Inline error banner. Slides down into place when a request fails. */
export function AuthAlert({ message }: { message: string }) {
  return (
    <motion.div
      className="auth-alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <i className="bi bi-exclamation-circle-fill" /> {message}
    </motion.div>
  )
}
