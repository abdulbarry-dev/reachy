import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { LoadingSpinner } from './LoadingSpinner'

gsap.registerPlugin(useGSAP)

export function PageFallback({ variant = 'page' }: { variant?: 'page' | 'inline' }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const bar = barRef.current
      if (!bar) return

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      if (prefersReduced) return

      const barTween = gsap.fromTo(
        bar,
        { xPercent: -100 },
        {
          xPercent: 100,
          duration: 1.4,
          repeat: -1,
          ease: 'power1.inOut',
        },
      )

      return () => {
        barTween.kill()
      }
    },
    { scope: containerRef },
  )

  return (
    <div
      ref={containerRef}
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: variant === 'inline' ? 320 : '100vh',
        background: 'var(--reachy-bg-soft, #f4fbf9)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div
        className="text-center p-4"
        style={{
          width: '100%',
          maxWidth: 320,
        }}
      >
        <div className="mb-3 d-flex justify-content-center">
          <LoadingSpinner size={46} color="var(--reachy-primary, #3AB397)" />
        </div>
        <div
          className="fw-semibold text-dark mb-1"
          style={{ fontSize: '1.0625rem', letterSpacing: '-0.015em' }}
        >
          Reachy
        </div>
        <div
          className="text-muted small mb-3"
          style={{ fontSize: '0.875rem' }}
        >
          Loading workspace...
        </div>
        <div
          style={{
            height: 3,
            width: 140,
            margin: '0 auto',
            background: 'rgba(58, 179, 151, 0.15)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            ref={barRef}
            style={{
              width: '50%',
              height: '100%',
              background:
                'linear-gradient(90deg, var(--reachy-primary, #3AB397), var(--reachy-secondary, #3AA8AD))',
              borderRadius: 999,
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    </div>
  )
}