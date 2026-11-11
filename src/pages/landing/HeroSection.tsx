import { useEffect, useRef, useState } from 'react'
import { Col, Container, Row, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
// Two motion systems coexist by intent (DESIGN.md section 6):
// - GSAP drives the hero atmosphere (aurora, starfield, entrance, parallax)
// - Framer Motion drives the small hero widgets and the rest of the page
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { StarfieldCanvas } from './StarfieldCanvas'
import { EASE_OUT_EXPO } from './landingMotion'
import './landingHero.css'

// ─── Hero mock data ──────────────────────────────────────────────────────────

const MOCK_DISPATCH_LOGS = [
  { email: 'john@stripe.com', status: 'Queued', time: 'Just now' },
  { email: 'clara@vercel.com', status: 'Sent', time: '1m ago' },
  { email: 'marcus@figma.com', status: 'Sent', time: '2m ago' },
  { email: 'sarah@airbnb.com', status: 'Sent', time: '3m ago' }
]

const HERO_STEPS = [
  { num: 'STEP 01', name: 'Connect SMTP', active: true },
  { num: 'STEP 02', name: 'Personalize', active: false },
  { num: 'STEP 03', name: 'Schedule Net', active: false }
] as const

// ─── Utility ────────────────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ─── Animated Counter Hook ───────────────────────────────────────────────────

function useCounter(target: number, duration = 1400, started = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    let raf: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, started])
  return value
}

// ─── Tilt Hook (cursor tracking, disabled under reduced motion) ──────────────

function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useSpring(0, { stiffness: 200, damping: 30 })
  const mouseY = useSpring(0, { stiffness: 200, damping: 30 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-8deg', '8deg'])

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    }
    const handleMouseLeave = () => {
      mouseX.set(0)
      mouseY.set(0)
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseX, mouseY])

  return { ref, rotateX, rotateY }
}

const HERO_STAR_COUNT = 110

// ─── Component ───────────────────────────────────────────────────────────────

export function HeroSection() {
  const navigate = useNavigate()
  const [dispatchLogIdx, setDispatchLogIdx] = useState(0)
  const [heroVisible, setHeroVisible] = useState(false)

  const cardRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { ref: tiltRef, rotateX, rotateY } = useTilt()
  const countSent = useCounter(142, 1200, heroVisible)
  const countReply = useCounter(246, 1400, heroVisible) // stored as int, displayed as /10 = 24.6%
  const countInbox = useCounter(992, 1600, heroVisible) // /10 = 99.2%

  // ── Hero visibility (counters) ──
  useEffect(() => {
    const el = heroRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setHeroVisible(true)
      return
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setHeroVisible(true)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── Dispatch log rotation ──
  useEffect(() => {
    const interval = setInterval(() => {
      setDispatchLogIdx((prev) => (prev + 1) % MOCK_DISPATCH_LOGS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // ── GSAP atmosphere: entrance, aurora drift, orbits, pointer parallax ──
  useGSAP(
    () => {
      const matchMedia = gsap.matchMedia()

      matchMedia.add(
        {
          motionOK: '(prefers-reduced-motion: no-preference)',
          finePointer: '(hover: hover) and (pointer: fine)'
        },
        (context) => {
          const conditions = context.conditions ?? {}
          if (!conditions.motionOK) return

          // Hero title — SplitText masked line reveal (once, on load).
          // autoSplit re-splits when the web font finishes loading; the tween
          // returned from onSplit() is cleaned up and time-synced per re-split.
          // A re-split after the reveal has started settles the lines instead of
          // replaying them, which would flash the headline mid-animation.
          let titleRevealed = false

          const titleSplit = SplitText.create('.hero-title', {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) => {
              if (titleRevealed) {
                gsap.set(self.lines, { yPercent: 0 })
                return
              }

              return gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.8,
                stagger: 0.09,
                ease: 'power3.out',
                onStart: () => {
                  titleRevealed = true
                },
              })
            },
          })

          // Entrance — once, on load, top-down
          gsap
            .timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
            .from('.hero-badge', { y: 16, autoAlpha: 0, duration: 0.55 }, 0)
            .from(['.hero-lead', '.hero-actions'], { y: 24, autoAlpha: 0, stagger: 0.09 }, 0.1)
            .from('.hero-step-item', { y: 18, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, 0.22)
            .from('.hero-mockup-entrance', { y: 32, scale: 0.97, autoAlpha: 0, duration: 0.85, ease: 'power2.out' }, 0.2)
            .from('.hero-glow-ring', { autoAlpha: 0, duration: 1.4, ease: 'power1.inOut' }, 0.3)

          // Aurora — large, slow, sine-driven drifts (8–16 s loops)
          gsap.to('.hero-aurora-1', { xPercent: 12, yPercent: -8, scale: 1.12, duration: 13, ease: 'sine.inOut', repeat: -1, yoyo: true })
          gsap.to('.hero-aurora-2', { xPercent: -10, yPercent: 9, scale: 1.08, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true })
          gsap.to('.hero-aurora-3', { xPercent: 8, yPercent: 6, duration: 10.5, ease: 'sine.inOut', repeat: -1, yoyo: true })

          // Orbits — the dispatcher's two slow satellites
          gsap.to('.hero-orbit-1', { rotation: 360, duration: 26, ease: 'none', repeat: -1 })
          gsap.to('.hero-orbit-2', { rotation: -360, duration: 38, ease: 'none', repeat: -1 })

          const cleanups: Array<() => void> = [() => titleSplit.revert()]

          if (!conditions.finePointer) return () => cleanups.forEach((fn) => fn())

          // Pointer parallax — one queued tween per layer, created once (quickTo)
          const card = cardRef.current
          if (!card) return () => cleanups.forEach((fn) => fn())

          const layers = [
            { el: card.querySelector<HTMLElement>('.hero-aurora-1'), depth: 12 },
            { el: card.querySelector<HTMLElement>('.hero-aurora-2'), depth: 18 },
            { el: card.querySelector<HTMLElement>('.hero-aurora-3'), depth: 8 },
            { el: card.querySelector<HTMLElement>('.hero-stars'), depth: 6 }
          ].filter((layer): layer is { el: HTMLElement, depth: number } => layer.el !== null)

          const movers = layers.map(({ el, depth }) => ({
            toX: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power2.out' }),
            toY: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power2.out' }),
            depth
          }))

          const onMove = (e: PointerEvent) => {
            const rect = card.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width - 0.5
            const ny = (e.clientY - rect.top) / rect.height - 0.5
            for (const mover of movers) {
              mover.toX(nx * mover.depth * 2)
              mover.toY(ny * mover.depth)
            }
          }
          const onLeave = () => {
            for (const mover of movers) {
              mover.toX(0)
              mover.toY(0)
            }
          }

          card.addEventListener('pointermove', onMove)
          card.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            card.removeEventListener('pointermove', onMove)
            card.removeEventListener('pointerleave', onLeave)
          })
          return () => cleanups.forEach((fn) => fn())
        }
      )

      return () => matchMedia.revert()
    },
    { scope: cardRef }
  )

  return (
    <section id="main-landing-content" className="lp-section pt-5 pb-5">
      <Container className="pt-5 mt-4">
        <div className="hero-container-card" ref={cardRef}>
          <div ref={heroRef} className="hero-atmosphere-anchor">
            {/* ── Atmosphere ── */}
            <div className="hero-cosmos" aria-hidden="true">
              <StarfieldCanvas className="hero-stars" starCount={HERO_STAR_COUNT} />
              <div className="hero-aurora hero-aurora-1" />
              <div className="hero-aurora hero-aurora-2" />
              <div className="hero-aurora hero-aurora-3" />
              <div className="hero-vignette" />
            </div>
            <div className="hero-glow-ring" aria-hidden="true" />

            <Row className="align-items-center hero-content-grid">
              {/* Vertical step indicators */}
              <Col lg={2} className="d-none d-lg-block">
                <div className="hero-steps-indicator">
                  {HERO_STEPS.map((step) => (
                    <div key={step.num} className={`hero-step-item ${step.active ? 'active' : ''}`}>
                      <div className="hero-step-num">{step.num}</div>
                      <div className="hero-step-name">{step.name}</div>
                    </div>
                  ))}
                </div>
              </Col>

              {/* Hero copy */}
              <Col lg={6} md={12} className="pe-lg-4 text-center text-lg-start">
                <div>
                  <span className="lp-badge hero-badge mb-3">
                    <i className="bi bi-rocket-takeoff-fill text-gradient" /> Deliverability First
                  </span>
                  <h1 className="hero-title mb-4">
                    Reach Prospects' <span className="text-gradient">Inbox</span>, Not the Spam Folder.
                  </h1>
                  <p className="hero-lead mb-4 pb-2">
                    Supercharge your cold outreach with automated sending delays, safe daily caps, and encrypted app password management. Built securely on Supabase.
                  </p>
                  <div className="hero-actions d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-3">
                    <Button className="btn-lp-primary" onClick={() => navigate('/signup')}>
                      Start Free Campaign
                    </Button>
                    <a href="#playground" className="btn-lp-outline text-decoration-none">
                      Try Personalization Tool
                    </a>
                  </div>
                </div>
              </Col>

              {/* Hero Mockup — floating in orbit */}
              <Col lg={4} className="mt-5 mt-lg-0">
                <div className="hero-mockup-stage">
                  <div className="hero-orbit hero-orbit-1" aria-hidden="true">
                    <span className="hero-orbit-dot" />
                  </div>
                  <div className="hero-orbit hero-orbit-2" aria-hidden="true">
                    <span className="hero-orbit-dot hero-orbit-dot-teal" />
                  </div>

                  <div className="hero-mockup-entrance">
                    <motion.div
                      className="hero-mockup-wrapper"
                      ref={tiltRef as React.RefObject<HTMLDivElement>}
                      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
                    >
                      <div className="bg-white border rounded-4 shadow p-4 border-light position-relative">
                        <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="d-block bg-primary rounded-circle" style={{ width: 10, height: 10 }} />
                            <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Campaign Dispatcher</h6>
                          </div>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">Active</span>
                        </div>

                        {/* Animated stat counters */}
                        <div className="row g-2 text-center mb-3">
                          <div className="col-4">
                            <div className="bg-light p-2 rounded border border-light-subtle">
                              <div className="text-muted small">Sent</div>
                              <strong className="text-dark">{countSent}</strong>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="bg-light p-2 rounded border border-light-subtle">
                              <div className="text-muted small">Replies</div>
                              <strong className="text-success">{(countReply / 10).toFixed(1)}%</strong>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="bg-light p-2 rounded border border-light-subtle">
                              <div className="text-muted small">Inbox Pl.</div>
                              <strong className="text-gradient">{(countInbox / 10).toFixed(1)}%</strong>
                            </div>
                          </div>
                        </div>

                        {/* Live dispatch log */}
                        <div className="bg-dark text-white rounded p-3 font-monospace" style={{ fontSize: '0.8rem', minHeight: 110 }}>
                          <div className="text-secondary border-bottom border-secondary pb-1 mb-2 d-flex justify-content-between">
                            <span>LIVE DISPATCH STATUS</span>
                            <span className="spinner-border spinner-border-sm text-success" role="status" />
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={dispatchLogIdx}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                            >
                              <div className="text-success">✉️ Sent matching template!</div>
                              <div className="text-light">To: {MOCK_DISPATCH_LOGS[dispatchLogIdx].email}</div>
                              <div className="text-warning">Status: {MOCK_DISPATCH_LOGS[dispatchLogIdx].status}</div>
                              <div className="text-secondary small font-monospace">Throttler delay: 60 seconds</div>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Floating security badge */}
                        <motion.div
                          className="hero-floating-banner"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                        >
                          <div className="floating-banner-icon">
                            <i className="bi bi-shield-check" />
                          </div>
                          <div>
                            <div className="fw-bold small">Zero Plaintext Storage</div>
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>SMTP Passwords encrypted in Supabase Vault</div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
    </section>
  )
}
