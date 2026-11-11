import { useRef } from 'react'
import { Container } from 'react-bootstrap'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import type { ReactNode } from 'react'

gsap.registerPlugin(useGSAP)

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = pageRef.current
      if (!el) return

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      if (prefersReduced) {
        gsap.set(el, { opacity: 1, y: 0 })
        return
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
      )
    },
    { scope: pageRef },
  )

  return (
    <div ref={pageRef} className={className} style={{ willChange: 'transform, opacity' }}>
      <Container>{children}</Container>
    </div>
  )
}
