// Shared Framer Motion presets for the landing page sections.
// The hero is GSAP-driven (see HeroSection.tsx), so these variants
// serve every other landing section.

import type { Variants } from 'framer-motion'

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
export const TRANSITION_BASE = { duration: 0.75, ease: EASE_OUT_EXPO }

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE }
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_BASE }
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_BASE }
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.0 } }
}

export const cardHoverEffect = {
  y: -8,
  scale: 1.015,
  boxShadow: 'var(--lp-card-hover-shadow, 0 24px 48px rgba(58, 179, 151, 0.12))',
  borderColor: 'var(--lp-card-hover-border, rgba(58, 179, 151, 0.25))',
  transition: { duration: 0.4, ease: EASE_OUT_EXPO }
}

export const highlightedCardHover = {
  y: -8,
  scale: 1.015,
  boxShadow: 'var(--lp-card-hover-highlight-shadow, 0 28px 56px rgba(58, 179, 151, 0.32))',
  transition: { duration: 0.4, ease: EASE_OUT_EXPO }
}
