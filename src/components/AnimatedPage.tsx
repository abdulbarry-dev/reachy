import { motion } from 'framer-motion'
import { Container } from 'react-bootstrap'
import type { ReactNode } from 'react'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
    >
      <Container>{children}</Container>
    </motion.div>
  )
}
