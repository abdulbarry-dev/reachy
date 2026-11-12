import { startTransition, useCallback, useRef, useState } from 'react'
import { Col, Container, Row, Button } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { StarfieldCanvas } from './StarfieldCanvas'
import { useCounter } from './useCounter'
import './landingHero.css'

// ─── Hero mock data (hoisted at module scope per vercel-react-best-practices) ─

interface DispatchLogItem {
  email: string
  status: 'Queued' | 'Sent'
  time: string
  stepIdx: number
}

const MOCK_DISPATCH_LOGS: readonly DispatchLogItem[] = [
  { email: 'john@stripe.com', status: 'Queued', time: 'Just now', stepIdx: 0 },
  { email: 'clara@vercel.com', status: 'Sent', time: '1m ago', stepIdx: 1 },
  { email: 'marcus@figma.com', status: 'Sent', time: '2m ago', stepIdx: 2 },
  { email: 'sarah@airbnb.com', status: 'Sent', time: '3m ago', stepIdx: 2 },
]

const HERO_STEPS = [
  { num: 'STEP 01', name: 'Connect SMTP' },
  { num: 'STEP 02', name: 'Personalize' },
  { num: 'STEP 03', name: 'Schedule Net' },
] as const

interface TrustSignal {
  icon: string
  label: string
  code: string | null
}

const TRUST_SIGNALS: readonly TrustSignal[] = [
  { icon: 'bi-google hero-trust-icon-gmail', label: 'Gmail Integration', code: null },
  { icon: 'bi-shield-lock-fill hero-trust-icon-vault', label: 'Supabase Vault', code: null },
  { icon: 'bi-cpu-fill hero-trust-icon-deno', label: 'Deno Edge Runtime', code: null },
  { icon: 'bi-clock-history hero-trust-icon-cron', label: 'Scheduling', code: 'pg_cron' },
]

/**
 * Counter formatters live at module scope so their identity is stable: a new
 * function on every render would restart the animation mid-flight.
 */
const formatInteger = (value: number) => String(value)
const formatPercentTenths = (value: number) => `${(value / 10).toFixed(1)}%`

const HERO_STAR_COUNT = 105
const DISPATCH_CYCLE_SECONDS = 3.8

// ─── Component ───────────────────────────────────────────────────────────────

export function HeroSection() {
  const router = useRouter()
  const [dispatchLogIdx, setDispatchLogIdx] = useState(0)
  const [activeStepIdx, setActiveStepIdx] = useState(0)

  const cardRef = useRef<HTMLElement | null>(null)
  const terminalBodyRef = useRef<HTMLDivElement | null>(null)
  const terminalProgressRef = useRef<HTMLDivElement | null>(null)
  const stepSelectHandlerRef = useRef<((idx: number) => void) | null>(null)

  // Above-the-fold counters start immediately on mount; SSR & reduced-motion
  // render the target values immediately with zero layout shift.
  const sentRef = useCounter(142, 1200, true, formatInteger)
  const replyRef = useCounter(246, 1400, true, formatPercentTenths)
  const inboxRef = useCounter(992, 1600, true, formatPercentTenths)

  const handlePrimaryAction = useCallback(() => {
    startTransition(() => {
      router.push('/signup')
    })
  }, [router])

  // ── Unified GSAP Choreography: entrance timeline, live console loop, parallax ──
  useGSAP(
    (_context, contextSafe) => {
      const safe = contextSafe ?? ((fn) => fn)

      // Context-safe interactive step selector (also callable when reduced-motion is on)
      stepSelectHandlerRef.current = safe((nextStepIdx: number) => {
        setActiveStepIdx(nextStepIdx)
        setDispatchLogIdx(nextStepIdx % MOCK_DISPATCH_LOGS.length)

        const bodyEl = terminalBodyRef.current
        const progressEl = terminalProgressRef.current
        const reduced =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (reduced || !bodyEl) return

        gsap.killTweensOf(bodyEl)
        gsap.fromTo(
          bodyEl,
          { autoAlpha: 0, y: 6 },
          { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power3.out', overwrite: true },
        )
        if (progressEl) {
          gsap.fromTo(
            progressEl,
            { scaleX: 0 },
            { scaleX: 1, duration: DISPATCH_CYCLE_SECONDS, ease: 'none', overwrite: true },
          )
        }
      })

      const matchMedia = gsap.matchMedia()

      matchMedia.add(
        {
          motionOK: '(prefers-reduced-motion: no-preference)',
          finePointer: '(hover: hover) and (pointer: fine)',
        },
        (context) => {
          const conditions = context.conditions ?? {}
          if (!conditions.motionOK) return

          // 1. Hero title — SplitText masked line reveal (once, on load).
          let titleRevealed = false

          const titleSplit = SplitText.create('.hero-title', {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) => {
              if (titleRevealed) {
                return gsap.set(self.lines, { yPercent: 0 })
              }

              return gsap.from(self.lines, {
                yPercent: 108,
                duration: 0.75,
                stagger: 0.08,
                ease: 'power3.out',
                onStart: () => {
                  titleRevealed = true
                },
              })
            },
          })

          // 2. Master Entrance Timeline — single cohesive page-load choreography
          gsap
            .timeline({ defaults: { ease: 'power3.out', duration: 0.65 } })
            .from('.hero-badge', { y: 12, autoAlpha: 0, duration: 0.48 }, 0)
            .from(['.hero-lead', '.hero-actions'], { y: 18, autoAlpha: 0, stagger: 0.08, duration: 0.56 }, 0.1)
            .from('.hero-step-item', { x: -10, autoAlpha: 0, stagger: 0.07, duration: 0.48 }, 0.18)
            .from(
              '.hero-mockup-entrance',
              { y: 22, scale: 0.985, autoAlpha: 0, duration: 0.72, ease: 'power3.out' },
              0.14,
            )
            .from(
              '.hero-stat-cell',
              { y: 10, autoAlpha: 0, stagger: 0.06, duration: 0.45 },
              0.32,
            )
            .from(
              '.hero-floating-banner',
              { y: 12, autoAlpha: 0, duration: 0.52 },
              0.42,
            )
            .from(
              '.hero-trust-item',
              { y: 10, autoAlpha: 0, stagger: 0.05, duration: 0.45 },
              0.32,
            )

          // 3. Ambient Aurora Drift — slow, low-amplitude sine loops on compositor
          gsap.to('.hero-aurora-1', {
            xPercent: 10,
            yPercent: -6,
            scale: 1.08,
            duration: 14,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
          gsap.to('.hero-aurora-2', {
            xPercent: -8,
            yPercent: 7,
            scale: 1.06,
            duration: 17,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
          gsap.to('.hero-aurora-3', {
            xPercent: 6,
            yPercent: 5,
            duration: 12,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })

          // 4. Subtle Orbit Rings — slow satellite rotation around the console
          gsap.to('.hero-orbit-1', { rotation: 360, duration: 34, ease: 'none', repeat: -1 })
          gsap.to('.hero-orbit-2', { rotation: -360, duration: 48, ease: 'none', repeat: -1 })

          // 5. GSAP-driven Dispatch Cadence Loop (pauses on console/step hover)
          const progressEl = terminalProgressRef.current
          const bodyEl = terminalBodyRef.current

          const advanceDispatchLog = safe(() => {
            if (!bodyEl) return
            gsap.to(bodyEl, {
              autoAlpha: 0,
              y: -5,
              duration: 0.16,
              ease: 'power2.in',
              onComplete: () => {
                setDispatchLogIdx((prev) => {
                  const next = (prev + 1) % MOCK_DISPATCH_LOGS.length
                  return next
                })
                setActiveStepIdx((prev) => (prev + 1) % HERO_STEPS.length)
                gsap.set(bodyEl, { autoAlpha: 0, y: 6 })
                gsap.to(bodyEl, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' })
              },
            })
          })

          if (progressEl) {
            gsap.set(progressEl, { scaleX: 0 })
          }
          const cycleTween = gsap.to(progressEl ?? {}, {
            scaleX: 1,
            duration: DISPATCH_CYCLE_SECONDS,
            ease: 'none',
            repeat: -1,
            onRepeat: advanceDispatchLog,
          })

          const card = cardRef.current
          const interactiveTargets = card
            ? Array.from(
                card.querySelectorAll<HTMLElement>('.hero-dispatcher-card, .hero-steps-indicator'),
              )
            : []

          const pauseCycle = () => {
            cycleTween.pause?.()
          }
          const resumeCycle = () => {
            cycleTween.play?.()
          }

          interactiveTargets.forEach((el) => {
            el.addEventListener('pointerenter', pauseCycle)
            el.addEventListener('pointerleave', resumeCycle)
          })

          const cleanups: Array<() => void> = [
            () => titleSplit.revert(),
            () => cycleTween.kill?.(),
            () => {
              interactiveTargets.forEach((el) => {
                el.removeEventListener('pointerenter', pauseCycle)
                el.removeEventListener('pointerleave', resumeCycle)
              })
            },
          ]

          // 6. Horizon Dissolve ScrollTrigger: subtly blooms the emerald dawn aura as the user scrolls
          const glowEl = card?.querySelector<HTMLElement>('.hero-horizon-glow')
          if (glowEl) {
            const glowTrigger = ScrollTrigger.create({
              trigger: card,
              start: 'top top',
              end: 'bottom top',
              scrub: 1.2,
              animation: gsap.fromTo(
                glowEl,
                { opacity: 0.5, scaleY: 0.85 },
                { opacity: 1, scaleY: 1.2, ease: 'power1.out' },
              ),
            })
            cleanups.push(() => glowTrigger.kill())
          }

          if (!conditions.finePointer || !card) {
            return () => cleanups.forEach((fn) => fn())
          }

          // 6. Pointer Depth Parallax on background atmosphere only (never tilts UI cards)
          const layers = [
            { el: card.querySelector<HTMLElement>('.hero-aurora-1'), depth: 12 },
            { el: card.querySelector<HTMLElement>('.hero-aurora-2'), depth: 18 },
            { el: card.querySelector<HTMLElement>('.hero-aurora-3'), depth: 8 },
            { el: card.querySelector<HTMLElement>('.hero-stars'), depth: 6 },
          ].filter((layer): layer is { el: HTMLElement; depth: number } => layer.el !== null)

          const movers = layers.map(({ el, depth }) => ({
            toX: gsap.quickTo(el, 'x', { duration: 0.75, ease: 'power3.out' }),
            toY: gsap.quickTo(el, 'y', { duration: 0.75, ease: 'power3.out' }),
            depth,
          }))

          let frame = 0
          let pending: { x: number; y: number } | null = null
          let rect: DOMRect | null = null
          let rectDirty = true

          const stageRect = () => {
            if (!rect || rectDirty) {
              rect = card.getBoundingClientRect()
              rectDirty = false
            }
            return rect
          }

          const flush = () => {
            frame = 0
            const point = pending
            pending = null
            if (!point) return

            const bounds = stageRect()
            const nx = (point.x - bounds.left) / bounds.width - 0.5
            const ny = (point.y - bounds.top) / bounds.height - 0.5
            for (const mover of movers) {
              mover.toX(nx * mover.depth * 2)
              mover.toY(ny * mover.depth)
            }
          }

          const onMove = (event: PointerEvent) => {
            pending = { x: event.clientX, y: event.clientY }
            if (frame === 0) frame = requestAnimationFrame(flush)
          }
          const onLeave = () => {
            pending = null
            if (frame !== 0) {
              cancelAnimationFrame(frame)
              frame = 0
            }
            for (const mover of movers) {
              mover.toX(0)
              mover.toY(0)
            }
          }

          const invalidateRect = () => {
            rectDirty = true
          }

          card.addEventListener('pointermove', onMove)
          card.addEventListener('pointerleave', onLeave)
          window.addEventListener('resize', invalidateRect)
          window.addEventListener('scroll', invalidateRect, { passive: true })

          cleanups.push(() => {
            card.removeEventListener('pointermove', onMove)
            card.removeEventListener('pointerleave', onLeave)
            window.removeEventListener('resize', invalidateRect)
            window.removeEventListener('scroll', invalidateRect)
            if (frame !== 0) cancelAnimationFrame(frame)
          })
          return () => cleanups.forEach((fn) => fn())
        },
      )

      return () => matchMedia.revert()
    },
    { scope: cardRef },
  )

  const currentLog = MOCK_DISPATCH_LOGS[dispatchLogIdx]

  return (
    <section
      id="main-landing-content"
      className="hero-fullscreen-stage hero-container-card"
      ref={cardRef}
    >
      <div className="hero-atmosphere-anchor">
        {/* ── Atmosphere ── */}
        <div className="hero-cosmos" aria-hidden="true">
          <StarfieldCanvas className="hero-stars" starCount={HERO_STAR_COUNT} />
          <div className="hero-aurora hero-aurora-1" />
          <div className="hero-aurora hero-aurora-2" />
          <div className="hero-aurora hero-aurora-3" />
          <div className="hero-grid-overlay" />
          <div className="hero-vignette" />
        </div>

        {/* Standard <Container> matches LandingNav for equal left and right content edges */}
        <Container className="hero-fullscreen-inner">
          <Row className="align-items-center hero-content-grid">
            {/* Vertical interactive step indicators */}
            <Col lg={2} className="d-none d-lg-block">
              <div className="hero-steps-indicator" role="group" aria-label="Outreach pipeline steps">
                {HERO_STEPS.map((step, idx) => {
                  const isActive = activeStepIdx === idx
                  return (
                    <button
                      key={step.num}
                      type="button"
                      className={`hero-step-item ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'step' : undefined}
                      onClick={() => stepSelectHandlerRef.current?.(idx)}
                    >
                      <span className="hero-step-num">{step.num}</span>
                      <span className="hero-step-name">{step.name}</span>
                    </button>
                  )
                })}
              </div>
            </Col>

            {/* Hero copy */}
            <Col lg={5} md={12} className="pe-lg-4 text-center text-lg-start">
              <div className="hero-copy-block">
                <span className="lp-badge hero-badge mb-3">
                  <i className="bi bi-rocket-takeoff-fill text-gradient" aria-hidden="true" /> Deliverability First
                </span>
                <h1 className="hero-title mb-3">
                  Reach Prospects&apos; <span className="text-gradient">Inbox</span>, Not the Spam Folder.
                </h1>
                <p className="hero-lead mb-4">
                  Supercharge your cold outreach with automated sending delays, safe daily caps, and encrypted app password management. Built securely on Supabase.
                </p>
                <div className="hero-actions d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-3">
                  <Button className="btn-lp-primary btn-hero-primary" onClick={handlePrimaryAction}>
                    Start Free Campaign
                  </Button>
                  <a href="#playground" className="btn-lp-outline btn-hero-secondary text-decoration-none">
                    Try Personalization Tool
                  </a>
                </div>
              </div>
            </Col>

            {/* Hero Console Mockup — disciplined planar surface, zero 3D tilt */}
            <Col lg={5} className="mt-5 mt-lg-0">
              <div className="hero-mockup-stage">
                <div className="hero-orbit hero-orbit-1" aria-hidden="true">
                  <span className="hero-orbit-dot" />
                </div>
                <div className="hero-orbit hero-orbit-2" aria-hidden="true">
                  <span className="hero-orbit-dot hero-orbit-dot-teal" />
                </div>

                <div className="hero-mockup-entrance">
                  <div className="hero-mockup-wrapper">
                    <div className="hero-dispatcher-card">
                      <div className="hero-dispatcher-header">
                        <div className="d-flex align-items-center gap-2">
                          <span className="hero-dispatcher-dot" aria-hidden="true" />
                          <h6 className="hero-dispatcher-title mb-0">Campaign Dispatcher</h6>
                        </div>
                        <span className="hero-dispatcher-badge">Active</span>
                      </div>

                      {/* Animated stat counters — pre-populated in JSX for SSR & instant paint */}
                      <div className="hero-dispatcher-stats">
                        <div className="hero-stat-cell">
                          <div className="hero-stat-label">Sent</div>
                          <strong className="hero-stat-value hero-stat-value-dark" ref={sentRef}>
                            142
                          </strong>
                        </div>
                        <div className="hero-stat-cell">
                          <div className="hero-stat-label">Replies</div>
                          <strong className="hero-stat-value hero-stat-value-emerald" ref={replyRef}>
                            24.6%
                          </strong>
                        </div>
                        <div className="hero-stat-cell">
                          <div className="hero-stat-label">Inbox Pl.</div>
                          <strong className="hero-stat-value text-gradient" ref={inboxRef}>
                            99.2%
                          </strong>
                        </div>
                      </div>

                      {/* Live dispatch log — pure GSAP transition + cadence progress rail */}
                      <div className="hero-terminal font-monospace">
                        <div className="hero-terminal-header">
                          <span>LIVE DISPATCH STATUS</span>
                          <span className="hero-terminal-pulse" role="status" aria-label="Dispatching active" />
                        </div>
                        <div className="hero-terminal-progress-track" aria-hidden="true">
                          <div ref={terminalProgressRef} className="hero-terminal-progress" />
                        </div>
                        <div ref={terminalBodyRef} className="hero-terminal-body">
                          <div className="hero-log-sent">
                            <i className="bi bi-envelope-check-fill me-2" aria-hidden="true" />
                            Sent matching template!
                          </div>
                          <div className="hero-log-to">
                            To: <span>{currentLog.email}</span>
                          </div>
                          <div className="hero-log-status">
                            Status: <span>{currentLog.status}</span>
                          </div>
                          <div className="hero-log-meta font-monospace">
                            Throttler delay: 60 seconds
                          </div>
                        </div>
                      </div>

                      {/* Grounded security badge — tactile layered elevation, no infinite bounce */}
                      <div className="hero-floating-banner">
                        <div className="floating-banner-icon" aria-hidden="true">
                          <i className="bi bi-shield-check" />
                        </div>
                        <div>
                          <div className="floating-banner-title">Zero Plaintext Storage</div>
                          <div className="floating-banner-subtitle">
                            SMTP Passwords encrypted in Supabase Vault
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── Integrated Bottom Console Trust Strip ── */}
          <div className="hero-console-footer">
            <div className="hero-trust-strip">
              <span className="hero-trust-label">Secured With:</span>
              <div className="hero-trust-items">
                {TRUST_SIGNALS.map((item) => (
                  <div key={item.label} className="hero-trust-item">
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    {item.code ? (
                      <>
                        <span className="hero-trust-pill">{item.code}</span> {item.label}
                      </>
                    ) : (
                      item.label
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ── Ambient Emerald Dawn Aurora Horizon Glow ── */}
      <div className="hero-horizon-glow" aria-hidden="true" />
    </section>
  )
}
