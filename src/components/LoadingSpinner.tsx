import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export interface LoadingSpinnerProps {
  size?: number | 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  label?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'var(--reachy-primary, #3AB397)',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGSVGElement>(null)
  const pulseRef = useRef<SVGCircleElement>(null)

  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
        ? 18
        : size === 'lg'
          ? 48
          : 30

  useGSAP(
    () => {
      const ring = ringRef.current
      const pulse = pulseRef.current
      if (!ring) return

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      if (prefersReduced) {
        gsap.set(ring, { opacity: 0.85 })
        return
      }

      // Smooth continuous 360 spin
      const spinTween = gsap.to(ring, {
        rotation: 360,
        transformOrigin: '50% 50%',
        duration: 0.9,
        ease: 'none',
        repeat: -1,
      })

      // Breathing glow core if pulse circle exists
      let pulseTween: gsap.core.Tween | null = null
      if (pulse) {
        pulseTween = gsap.to(pulse, {
          scale: 1.25,
          opacity: 0.4,
          transformOrigin: '50% 50%',
          duration: 0.75,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }

      return () => {
        spinTween.kill()
        pulseTween?.kill()
      }
    },
    { scope: containerRef },
  )

  return (
    <div
      ref={containerRef}
      className={`d-inline-flex align-items-center justify-content-center ${className}`}
      role="status"
      aria-label={label}
      style={{
        width: pixelSize,
        height: pixelSize,
        verticalAlign: 'middle',
      }}
    >
      <svg
        ref={ringRef}
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ willChange: 'transform' }}
      >
        {/* Subtle background track */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="3.5"
        />
        {/* Outer accent gradient arc */}
        <path
          d="M36 20C36 11.1634 28.8366 4 20 4"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Pulsing center point for medium/large sizes */}
        {pixelSize >= 28 && (
          <circle
            ref={pulseRef}
            cx="20"
            cy="20"
            r="3.5"
            fill={color}
            opacity="0.85"
          />
        )}
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
