import { useEffect, useRef } from 'react'

/**
 * Decorative canvas starfield for dark "mission control" surfaces.
 * Stars drift slowly upward — one for every send leaving the atmosphere.
 *
 - Purely decorative, palette-locked (star / Emerald / Teal alphas).
 - DPR-aware; redraws at static positions when the user prefers
   reduced motion, and a single static frame in environments where
   a 2D drawing context is unavailable (e.g. jsdom).
 - Paused via IntersectionObserver + visibilitychange so no frames
   are burned while off-screen or in a hidden tab.
 */

interface Star {
  x: number
  y: number
  size: number
  alpha: number
  twinkleSpeed: number
  phase: number
  drift: number
  hue: 'star' | 'mint' | 'teal'
}

const STAR_HUE_RGB = {
  star: '244, 251, 249',
  mint: '58, 179, 151',
  teal: '58, 168, 173'
} as const

function createStar(width: number, height: number, seededAnywhere: boolean): Star {
  const hueRoll = Math.random()
  return {
    x: Math.random() * width,
    y: seededAnywhere ? Math.random() * height : height + 4,
    size: 0.6 + Math.random() * 1.7,
    alpha: 0.2 + Math.random() * 0.55,
    twinkleSpeed: 0.6 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    drift: 0.08 + Math.random() * 0.32,
    hue: hueRoll < 0.72 ? 'star' : hueRoll < 0.9 ? 'mint' : 'teal'
  }
}

interface StarfieldCanvasProps {
  className?: string
  starCount?: number
}

export function StarfieldCanvas({ className, starCount = 110 }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let stars: Star[] = []
    let width = 0
    let height = 0
    let raf = 0
    let isRunning = false
    let inView = true
    let time = 0
    let observer: IntersectionObserver | null = null

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars = Array.from({ length: starCount }, () => createStar(width, height, true))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.phase)
        ctx.globalAlpha = star.alpha * twinkle
        ctx.fillStyle = `rgba(${STAR_HUE_RGB[star.hue]}, 1)`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const tick = () => {
      time += 0.016
      for (const star of stars) {
        star.y -= star.drift
        if (star.y < -4) {
          star.y = height + 4
          star.x = Math.random() * width
        }
      }
      draw()
      if (isRunning) raf = requestAnimationFrame(tick)
    }

    const syncPlayState = () => {
      const shouldRun = !reduced && inView && !document.hidden
      if (shouldRun && !isRunning) {
        isRunning = true
        raf = requestAnimationFrame(tick)
      } else if (!shouldRun && isRunning) {
        isRunning = false
        cancelAnimationFrame(raf)
      }
    }

    const handleResize = () => {
      resize()
      if (width > 0) draw()
      syncPlayState()
    }

    resize()
    if (width > 0) draw()

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting
          syncPlayState()
        },
        { threshold: 0.05 }
      )
      observer.observe(canvas)
    }

    const handleVisibility = () => syncPlayState()

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isRunning = false
      cancelAnimationFrame(raf)
      observer?.disconnect()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [starCount])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
