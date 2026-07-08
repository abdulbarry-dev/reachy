import { useState, useEffect, useRef, useCallback } from 'react'
import { Container, Row, Col, Button, Form } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence, useSpring, useTransform, type Variants } from 'framer-motion'
import type { RootState } from '../store'
import './LandingPage.css'

// ─── Easing & Motion Presets ────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const TRANSITION_BASE = { duration: 0.75, ease: EASE_OUT_EXPO }

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE }
}

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_BASE }
}

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_BASE }
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: TRANSITION_BASE }
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}

const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.0 } }
}

const cardHoverEffect = {
  y: -8,
  scale: 1.015,
  boxShadow: '0 24px 48px rgba(58, 179, 151, 0.12)',
  borderColor: 'rgba(58, 179, 151, 0.25)',
  transition: { duration: 0.4, ease: EASE_OUT_EXPO }
}

const highlightedCardHover = {
  y: -8,
  scale: 1.015,
  boxShadow: '0 28px 56px rgba(58, 179, 151, 0.32)',
  transition: { duration: 0.4, ease: EASE_OUT_EXPO }
}

// ─── Static Data ─────────────────────────────────────────────────────────────

interface MockRecipient {
  first_name: string
  company: string
  product: string
  email: string
}

const MOCK_RECIPIENTS: MockRecipient[] = [
  { first_name: 'Alex', company: 'Stripe', product: 'Payment APIs', email: 'alex@stripe.com' },
  { first_name: 'Elena', company: 'Vercel', product: 'Hosting', email: 'elena@vercel.com' },
  { first_name: 'Marcus', company: 'Figma', product: 'Design Tools', email: 'marcus@figma.com' }
]

const MOCK_DISPATCH_LOGS = [
  { email: 'john@stripe.com', status: 'Queued', time: 'Just now' },
  { email: 'clara@vercel.com', status: 'Sent', time: '1m ago' },
  { email: 'marcus@figma.com', status: 'Sent', time: '2m ago' },
  { email: 'sarah@airbnb.com', status: 'Sent', time: '3m ago' }
]

// ─── Animated Counter Hook ───────────────────────────────────────────────────

function useCounter(target: number, duration = 1400, started = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, started])
  return value
}

// ─── Tilt Hook (cursor tracking) ─────────────────────────────────────────────

function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useSpring(0, { stiffness: 200, damping: 30 })
  const mouseY = useSpring(0, { stiffness: 200, damping: 30 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-8deg', '8deg'])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return { ref, rotateX, rotateY }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  // Interactive template playground
  const [templateText, setTemplateText] = useState(
    "Hi {{first_name}},\n\nI noticed you work at {{company}}. Would you be open to checking out Reachy to automate personalized campaigns for {{product}}?\n\nBest,\nSarah"
  )
  const [selectedRecipientIdx, setSelectedRecipientIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Safety slider
  const [dailySends, setDailySends] = useState(90)

  // Dispatch log rotation
  const [dispatchLogIdx, setDispatchLogIdx] = useState(0)

  // Hero mockup counter (triggered when hero is visible)
  const [heroVisible, setHeroVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const countSent = useCounter(142, 1200, heroVisible)
  const countReply = useCounter(246, 1400, heroVisible) // stored as int, displayed as /10 = 24.6%
  const countInbox = useCounter(992, 1600, heroVisible) // /10 = 99.2%

  // Tilt effect for hero mockup
  const { ref: tiltRef, rotateX, rotateY } = useTilt()

  // ── Scroll listener ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Active section via IntersectionObserver ──
  useEffect(() => {
    const sectionIds = ['features', 'workflow', 'playground', 'deliverability']
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.35 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // ── Hero visibility (for counters) ──
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
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

  // ── Insert variable at cursor ──
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const updatedText = text.substring(0, start) + `{{${variable}}}` + text.substring(end)
    setTemplateText(updatedText)
    setTimeout(() => {
      textarea.focus()
      const pos = start + variable.length + 4
      textarea.setSelectionRange(pos, pos)
    }, 50)
  }

  const getRenderedPreview = () => {
    const r = MOCK_RECIPIENTS[selectedRecipientIdx]
    return templateText
      .replaceAll('{{first_name}}', r.first_name)
      .replaceAll('{{company}}', r.company)
      .replaceAll('{{product}}', r.product)
  }

  const getSafetyInfo = (sends: number) => {
    if (sends <= 90) return {
      status: 'Safe', class: 'status-safe', icon: 'bi-shield-check',
      deliverability: '99%',
      desc: 'Ideal for free Gmail accounts. Stays well under behavioral triggers to guarantee inbox delivery.'
    }
    if (sends <= 200) return {
      status: 'Warning', class: 'status-warning', icon: 'bi-exclamation-triangle',
      deliverability: '82%',
      desc: 'Approaching limits. Google may begin routing high volumes to promotions or temporary delay queues.'
    }
    return {
      status: 'Risky', class: 'status-risky', icon: 'bi-shield-slash',
      deliverability: '54%',
      desc: 'High risk of ban. Standard Gmail limits are 100/day for manual send behaviors. Spam filters will block you.'
    }
  }

  const safetyInfo = getSafetyInfo(dailySends)

  // SVG logo path (shared between header and footer)
  const LogoSvg = ({ className }: { className?: string }) => (
    <svg className={className ?? 'lp-logo-svg'} viewBox="0 0 340 350" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0.000000,350.000000) scale(0.100000,-0.100000)" fill="currentColor">
        <path d="M511 3255 c-82 -187 -117 -386 -108 -623 8 -224 65 -406 173 -553 44 -61 163 -172 214 -201 22 -13 40 -25 40 -28 0 -3 -35 -13 -77 -23 -200 -45 -406 -177 -526 -337 -43 -57 -147 -247 -147 -269 0 -7 30 -11 83 -11 107 0 252 -22 352 -54 108 -34 253 -118 332 -191 61 -56 66 -64 70 -111 6 -55 -9 -94 -54 -148 -56 -68 -186 -147 -322 -196 -94 -35 -93 -36 -61 75 30 107 94 227 156 294 l55 59 -28 20 c-43 30 -90 52 -110 52 -36 0 -135 -126 -178 -226 -28 -65 -65 -175 -79 -239 -19 -81 -40 -254 -32 -262 10 -10 155 15 253 43 48 14 138 49 198 78 171 82 276 171 331 279 14 26 29 45 34 42 5 -3 26 -35 46 -71 55 -99 93 -228 112 -386 13 -114 19 -137 31 -133 43 17 207 123 267 173 133 112 248 281 303 448 20 60 35 141 46 256 l6 56 77 58 c105 80 301 271 377 369 156 200 260 407 330 660 37 131 64 184 121 234 50 44 107 65 206 77 32 3 58 10 58 14 0 18 -68 96 -110 127 -57 40 -72 55 -121 121 -45 59 -106 102 -183 129 -66 23 -207 22 -296 -1 -244 -65 -545 -188 -684 -281 l-53 -35 -109 66 c-60 36 -154 88 -209 116 -162 82 -254 136 -361 214 -136 99 -237 200 -313 314 -35 52 -64 96 -66 98 -1 1 -21 -40 -44 -93z m174 -333 c112 -106 266 -207 540 -353 382 -204 489 -298 563 -498 20 -53 26 -91 30 -197 7 -191 -22 -318 -99 -432 l-31 -45 34 29 c50 43 118 126 159 195 48 79 79 175 89 278 l9 85 102 102 102 103 46 -39 c25 -22 47 -38 49 -36 3 4 72 305 72 317 0 7 -309 -68 -319 -78 -3 -2 14 -23 37 -46 l42 -43 -79 -78 c-43 -43 -81 -74 -83 -70 -3 5 -11 27 -18 49 -18 57 -55 120 -118 199 -64 80 -68 70 57 134 165 86 485 196 602 209 31 3 72 3 91 -1 50 -9 121 -59 153 -108 l28 -42 -24 -15 c-102 -66 -148 -145 -211 -359 -49 -167 -98 -283 -172 -407 -198 -331 -526 -605 -1001 -837 l-148 -72 -34 40 c-19 21 -46 54 -60 72 l-26 33 100 102 c117 119 156 176 185 270 52 173 -14 357 -167 464 l-29 21 59 78 c33 44 114 136 182 205 l123 126 -53 26 c-108 54 -98 56 -189 -31 -70 -67 -185 -202 -254 -298 l-21 -29 -81 49 c-122 74 -214 171 -267 281 -41 87 -59 135 -48 135 3 0 32 -25 66 -55 42 -38 99 -74 182 -115 170 -83 155 -83 187 4 l26 74 -71 32 c-103 47 -228 132 -281 191 -55 62 -112 173 -127 251 -11 53 -5 208 8 208 3 0 42 -35 88 -78z m434 -1238 c22 -19 49 -54 60 -78 28 -57 28 -155 1 -215 -20 -42 -194 -231 -233 -253 -15 -8 -30 -2 -73 26 -30 20 -54 43 -54 51 0 36 165 386 228 483 19 29 25 28 71 -14z m-279 -9 c0 -3 -19 -42 -42 -88 -23 -45 -63 -131 -89 -192 -26 -60 -51 -109 -56 -107 -4 1 -41 13 -81 27 -40 14 -106 31 -147 38 -41 6 -75 15 -75 19 0 4 28 37 61 73 95 101 218 177 354 216 68 20 75 21 75 14z m851 -826 c-38 -150 -138 -313 -247 -401 -48 -39 -64 -41 -64 -6 0 28 -67 227 -87 257 -12 18 -13 26 -4 29 27 9 320 161 366 190 28 17 51 27 53 22 2 -5 -6 -46 -17 -91z"/>
      </g>
    </svg>
  )

  return (
    <div className="landing-wrapper min-vh-100">
      {/* Background Blobs */}
      <div className="lp-blob lp-blob-1" />
      <div className="lp-blob lp-blob-2" />
      <div className="lp-blob lp-blob-3" />

      {/* ── Navbar ── */}
      <motion.nav
        className={`navbar navbar-expand-lg fixed-top lp-navbar ${scrolled ? 'scrolled' : ''}`}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <Container>
          <a href="#" className="lp-brand">
            <LogoSvg />
            <span>Reachy</span>
          </a>

          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#lpNavbarNav">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="lpNavbarNav">
            <div className="navbar-nav mx-auto align-items-center">
              {(['features', 'workflow', 'playground', 'deliverability'] as const).map((id, i) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  className={`lp-nav-link ${activeSection === id ? 'active' : ''}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: EASE_OUT_EXPO }}
                >
                  {id === 'features' ? 'Features' : id === 'workflow' ? 'How it Works' : id === 'playground' ? 'Playground' : 'Deliverability'}
                  {activeSection === id && (
                    <motion.span
                      className="lp-nav-active-dot"
                      layoutId="navActiveDot"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </motion.a>
              ))}
            </div>

            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {user ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
                  <Button className="btn-lp-nav-cta" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard <i className="bi bi-arrow-right ms-1" />
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38, duration: 0.45, ease: EASE_OUT_EXPO }}>
                    <Link to="/login" className="lp-nav-link text-decoration-none" style={{ margin: 0 }}>Log In</Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.46, duration: 0.45, ease: EASE_OUT_EXPO }}>
                    <Link to="/signup" className="btn-lp-nav-cta text-decoration-none">Get Started</Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </Container>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="lp-section pt-5 pb-5">
        <Container className="pt-5 mt-4">
          <div className="hero-container-card" ref={heroRef}>
            {/* Animated glow ring behind the card */}
            <div className="hero-glow-ring" />

            <Row className="align-items-center">
              {/* Vertical step indicators */}
              <Col lg={2} className="d-none d-lg-block">
                <motion.div
                  className="hero-steps-indicator"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  {[
                    { num: 'STEP 01', name: 'Connect SMTP', active: true },
                    { num: 'STEP 02', name: 'Personalize', active: false },
                    { num: 'STEP 03', name: 'Schedule Net', active: false }
                  ].map((step) => (
                    <motion.div key={step.num} className={`hero-step-item ${step.active ? 'active' : ''}`} variants={fadeInUp}>
                      <div className="hero-step-num">{step.num}</div>
                      <div className="hero-step-name">{step.name}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </Col>

              {/* Hero copy */}
              <Col lg={6} md={12} className="pe-lg-4 text-center text-lg-start">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                  <motion.span className="lp-badge mb-3" variants={fadeInUp}>
                    <i className="bi bi-rocket-takeoff-fill text-gradient" /> Deliverability First
                  </motion.span>
                  <motion.h1 className="hero-title mb-4" variants={fadeInUp}>
                    Reach Prospects' <span className="text-gradient">Inbox</span>, Not the Spam Folder.
                  </motion.h1>
                  <motion.p className="lead text-muted mb-4 pb-2" style={{ fontSize: '1.15rem' }} variants={fadeInUp}>
                    Supercharge your cold outreach with automated sending delays, safe daily caps, and encrypted app password management. Built securely on Supabase.
                  </motion.p>
                  <motion.div className="d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-3" variants={fadeInUp}>
                    <Button className="btn-lp-primary" onClick={() => navigate('/signup')}>
                      Start Free Campaign
                    </Button>
                    <a href="#playground" className="btn-lp-outline text-decoration-none">
                      Try Personalization Tool
                    </a>
                  </motion.div>
                </motion.div>
              </Col>

              {/* Hero Mockup with tilt */}
              <Col lg={4} className="mt-5 mt-lg-0">
                <motion.div
                  className="hero-mockup-wrapper"
                  ref={tiltRef as React.RefObject<HTMLDivElement>}
                  style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
                  initial="hidden"
                  animate="visible"
                  variants={scaleIn}
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
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── Integration Logos ── */}
      <section className="py-4">
        <Container>
          <motion.div
            className="logos-slider-container"
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <motion.span className="small text-uppercase fw-bold text-secondary me-lg-4" variants={fadeInUp}>Secured With:</motion.span>
            {[
              { icon: 'bi-google text-danger', label: 'Gmail Integration', code: null },
              { icon: 'bi-shield-lock-fill text-primary', label: 'Supabase Vault', code: null },
              { icon: 'bi-cpu-fill text-warning', label: 'Deno Edge Runtime', code: null },
              { icon: 'bi-clock-history text-success', label: 'Scheduling', code: 'pg_cron' }
            ].map((item) => (
              <motion.div key={item.label} className="logo-item" variants={fadeInUp}>
                <i className={`bi ${item.icon}`} />
                {item.code
                  ? <><span className="logo-code-pill">{item.code}</span> {item.label}</>
                  : item.label
                }
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="lp-section">
        <Container>
          <motion.div
            className="section-header text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={TRANSITION_BASE}
          >
            <span className="lp-badge mb-2">Features Suite</span>
            <h2>Designed to Prevent Spam Triggers</h2>
            <p className="text-muted">
              Unlike generic bulk mail tools, Reachy structures every aspect of the send pipeline around Gmail security principles.
            </p>
          </motion.div>

          <motion.div
            className="row g-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {[
              {
                badge: 'SECURE', icon: 'bi-safe2', title: 'Vault Encryption', code: null,
                desc: 'Your SMTP credentials are kept out of plaintext databases. They are encrypted using pg_vault and read only inside isolated Edge Functions during dispatch.',
                variant: fadeInLeft
              },
              {
                badge: 'COMPLIANT', icon: 'bi-arrow-repeat', title: 'Smart Inbox Rotation', code: null,
                desc: 'Keep daily sending volumes small (under 90/day) across multiple connected accounts to bypass Gmail spam detection and build long-term IP reputation.',
                variant: fadeInUp
              },
              {
                badge: 'AUTOMATED', icon: 'bi-calendar-check', title: 'Dispatching', code: 'pg_cron',
                desc: 'Our send pipeline isn\'t a simple loop that runs into timeouts. A postgres scheduler triggers a dispatch tick every 60s, keeping sending rhythmic and natural.',
                variant: fadeInRight
              }
            ].map((card) => (
              <Col md={4} key={card.title}>
                <motion.div
                  className="feature-card"
                  variants={card.variant}
                  whileHover={cardHoverEffect}
                >
                  <div className="feature-badge">{card.badge}</div>
                  <div className="feature-icon-box">
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">
                    {card.code
                      ? <><span className="feature-code-tag">{card.code}</span> {card.title}</>
                      : card.title
                    }
                  </h4>
                  <p className="text-muted mb-0">{card.desc}</p>
                </motion.div>
              </Col>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ── Playground ── */}
      <section id="playground" className="lp-section bg-light-subtle border-top border-bottom border-light">
        <Container>
          <motion.div
            className="section-header text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={TRANSITION_BASE}
          >
            <span className="lp-badge mb-2">Live Playground</span>
            <h2>Personalize Templates Live</h2>
            <p className="text-muted">
              Type custom templates, click variables to insert tags, and toggle between target prospects to see personalized text instantly.
            </p>
          </motion.div>

          <motion.div
            className="widget-container"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={TRANSITION_BASE}
          >
            <Row className="g-4">
              <Col lg={6}>
                <div className="pe-lg-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold small text-uppercase text-secondary">1. Dynamic Merge Variables</span>
                    <span className="small text-muted">Click tag to insert</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {['first_name', 'company', 'product'].map((v) => (
                      <motion.button key={v} whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.04 }} className="widget-var-badge" onClick={() => insertVariable(v)}>
                        {v}
                      </motion.button>
                    ))}
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-uppercase text-secondary">2. Compose Email Content</Form.Label>
                    <Form.Control
                      ref={textareaRef}
                      as="textarea"
                      rows={6}
                      value={templateText}
                      onChange={(e) => setTemplateText(e.target.value)}
                      className="border rounded-3 p-3 font-monospace"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </Form.Group>

                  <div>
                    <div className="fw-bold small text-uppercase text-secondary mb-2">3. Select Target Prospect</div>
                    <div className="d-flex gap-2 flex-wrap">
                      {MOCK_RECIPIENTS.map((r, idx) => (
                        <motion.button
                          key={r.email}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRecipientIdx(idx)}
                          className={`btn btn-sm rounded-pill px-3 ${selectedRecipientIdx === idx ? 'btn-success' : 'btn-outline-secondary'}`}
                        >
                          {r.first_name} ({r.company})
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={6}>
                <div className="ps-lg-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold small text-uppercase text-secondary">Recipient Preview</span>
                    <span className="small text-muted font-monospace">{MOCK_RECIPIENTS[selectedRecipientIdx].email}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedRecipientIdx}-${templateText.length}`}
                      initial={{ opacity: 0.7, filter: 'blur(3px)', y: 6 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      exit={{ opacity: 0, filter: 'blur(3px)', y: -6 }}
                      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                      className="widget-preview-box"
                    >
                      <div className="widget-preview-header">
                        <div><strong>To:</strong> {MOCK_RECIPIENTS[selectedRecipientIdx].first_name} &lt;{MOCK_RECIPIENTS[selectedRecipientIdx].email}&gt;</div>
                        <div><strong>From:</strong> Sarah @ Reachy Campaigns</div>
                        <div><strong>Subject:</strong> Quick question regarding {MOCK_RECIPIENTS[selectedRecipientIdx].company}</div>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {getRenderedPreview()}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-4 bg-success-subtle text-success p-3 rounded-3 border border-success-subtle d-flex align-items-start gap-2">
                    <i className="bi bi-info-circle-fill mt-1" />
                    <div className="small">
                      Import columns directly from CSV headers. Reachy automatically validates and inserts values into campaign queues.
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Container>
      </section>

      {/* ── Workflow Steps ── */}
      <section id="workflow" className="lp-section">
        <Container>
          <motion.div
            className="section-header text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={TRANSITION_BASE}
          >
            <span className="lp-badge mb-2">Simple Setup</span>
            <h2>How Reachy Automated Outbound</h2>
            <p className="text-muted">
              Get running in minutes. Our architecture ensures your cold email campaign stays within parameters.
            </p>
          </motion.div>

          <motion.div
            className="row g-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {[
              {
                num: '1', title: 'Connect SMTP Link', variant: fadeInLeft,
                desc: 'Log in, enter your SMTP details and Google App Password. Our connect-email-account Deno script immediately tests validation status.',
                link: 'Set Up Now', hover: cardHoverEffect, highlighted: false
              },
              {
                num: '2', title: 'Create & Parse CSV', variant: fadeInUp,
                desc: 'Upload CSV list of leads with merge headers. Review variables, write templates with custom merge fields, and set hourly/daily throttle limits.',
                link: 'Upload Contacts', hover: highlightedCardHover, highlighted: true
              },
              {
                num: '3', title: 'Auto-pilot Dispatch', variant: fadeInRight,
                desc: 'Queue the campaign. Postgres scheduler handles sends one-by-one, pacing delivery at precise sending intervals to keep Google servers happy.',
                link: 'Launch Queue', hover: cardHoverEffect, highlighted: false
              }
            ].map((step) => (
              <Col lg={4} key={step.num}>
                <motion.div
                  className={`step-card ${step.highlighted ? 'highlighted' : ''}`}
                  variants={step.variant}
                  whileHover={step.hover}
                >
                  <div className="step-num-badge">{step.num}</div>
                  <h4 className={`step-title fw-bold mb-3 ${step.highlighted ? 'text-white' : 'text-dark'}`}>{step.title}</h4>
                  <p className="step-desc mb-3">{step.desc}</p>
                  <Link to="/signup" className="step-link">
                    {step.link} <i className="bi bi-chevron-right" />
                  </Link>
                </motion.div>
              </Col>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ── Deliverability Gauge ── */}
      <section id="deliverability" className="lp-section bg-light-subtle">
        <Container>
          <motion.div
            className="section-header text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={TRANSITION_BASE}
          >
            <span className="lp-badge mb-2">Deliverability Advisor</span>
            <h2>Adjust Sending Speed Safely</h2>
            <p className="text-muted">
              Gmail limits and thresholds are behavioral. Slide daily sends to analyze risk factors.
            </p>
          </motion.div>

          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div
                className="gauge-card"
                initial={{ opacity: 0, scale: 0.97, y: 24 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={TRANSITION_BASE}
              >
                <Row className="align-items-center">
                  <Col md={6} className="mb-4 mb-md-0">
                    <h4 className="fw-bold mb-3 text-white">Daily Volume Gauge</h4>
                    <p className="text-secondary small mb-4">
                      Dragging this slider simulates how Google Workspace spam heuristics analyze your outbound behaviors.
                    </p>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-secondary">Target Daily Cap</span>
                        <strong className="text-white" style={{ fontSize: '1.25rem' }}>{dailySends} emails/day</strong>
                      </div>
                      <input
                        type="range" min="10" max="500" value={dailySends}
                        onChange={(e) => setDailySends(parseInt(e.target.value))}
                        className="slider-custom"
                      />
                      <div className="d-flex justify-content-between small text-secondary mt-1">
                        <span>10 (Minimum)</span>
                        <span>500 (Maximum)</span>
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="ps-md-4 text-center text-md-start border-start-md border-secondary-subtle">
                      <div className="small text-secondary mb-2">RISK EVALUATION</div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={safetyInfo.status}
                          initial={{ opacity: 0, scale: 0.9, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 8 }}
                          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                          className={`status-badge-lg mb-3 ${safetyInfo.class}`}
                        >
                          <i className={`bi ${safetyInfo.icon}`} /> {safetyInfo.status} Status
                        </motion.div>
                      </AnimatePresence>

                      <div className="mb-3">
                        <div className="small text-secondary">ESTIMATED INBOX DELIVERABILITY</div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={safetyInfo.deliverability}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="display-4 fw-bold text-white"
                          >
                            {safetyInfo.deliverability}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <p className="small text-secondary mb-0">{safetyInfo.desc}</p>
                    </div>
                  </Col>
                </Row>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Split Showcase ── */}
      <section className="lp-section">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <motion.div
                className="split-img-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-120px' }}
                variants={fadeInLeft}
              >
                <img src="/reachy-logo.png" alt="Reachy logo branding" />
                <motion.div
                  className="split-overlay-tag"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ ...TRANSITION_BASE, delay: 0.25 }}
                >
                  <span style={{ fontSize: '1.35rem' }}>90 / day</span>
                  <span className="small text-secondary">Maximum Safety Recommended</span>
                </motion.div>
              </motion.div>
            </Col>

            <Col lg={7}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={staggerContainer}
              >
                <motion.span className="lp-badge mb-3" variants={fadeInRight}>Branding &amp; Philosophy</motion.span>
                <motion.h2 className="display-6 fw-bold mb-4 text-dark" variants={fadeInRight}>Crafted for Clean Outreach</motion.h2>
                <motion.p className="text-muted mb-4" variants={fadeInRight}>
                  We believe cold outreach should be intentional, highly targeted, and technically secure. Reachy is designed so that you cannot accidentally trigger filters. By enforcing strict sending schedules and secure Vault infrastructure, your branding remains spotless.
                </motion.p>

                <div className="row g-3 mb-5">
                  {[
                    { title: 'Clean Domain Health', desc: 'Keep sender accounts off lists by regulating outbound volume.' },
                    { title: 'Fully Auditable Stack', desc: 'Open-source codebase runs entirely inside your control.' },
                    { title: 'Vault-encrypted Secrets', desc: 'Zero plaintext SMTP credential storage in any database row.' },
                    { title: 'Safe by Default', desc: 'Default rate limits keep you under Gmail behavioral thresholds.' }
                  ].map((item) => (
                    <motion.div key={item.title} className="col-sm-6" variants={fadeInRight}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i className="bi bi-check-circle-fill text-success" />
                        <strong className="text-dark">{item.title}</strong>
                      </div>
                      <div className="small text-muted">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>

                <motion.div className="split-bottom-cta-banner" variants={fadeInRight}>
                  <div>
                    <div className="fw-bold text-dark">Ready to improve deliverability?</div>
                    <div className="small text-muted">Launch campaigns with our default safety parameters.</div>
                  </div>
                  <Button className="btn-lp-primary" onClick={() => navigate('/signup')}>
                    Get Started
                  </Button>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <Row className="g-4 mb-5 border-bottom border-secondary pb-5">
              <Col lg={4}>
                <motion.div variants={fadeInUp}>
                  <a href="#" className="lp-footer-brand mb-3">
                    <LogoSvg />
                    <span>Reachy</span>
                  </a>
                  <p className="small text-secondary mb-3 mt-3">
                    Secure cold email automation designed to respect sending thresholds and safeguard sender credentials.
                  </p>
                  <div className="d-flex gap-3 text-secondary" style={{ fontSize: '1.25rem' }}>
                    {[
                      { icon: 'bi-github', href: 'https://github.com/abdulbarry-dev/reachy' },
                      { icon: 'bi-twitter-x', href: 'https://x.com/AbdulbarryG' },
                      { icon: 'bi-linkedin', href: 'https://www.linkedin.com/in/abdulbarryguenichi/' },
                    ].map(({ icon, href }) => (
                      <a key={icon} href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-secondary">
                        <motion.i className={`bi ${icon}`} whileHover={{ color: '#3AB397', scale: 1.2 }} />
                      </a>
                    ))}
                  </div>
                </motion.div>
              </Col>

              <Col xs={6} lg={4}>
                <motion.div variants={fadeInUp}>
                  <h6 className="text-white fw-bold mb-3">Product</h6>
                  <div className="d-flex flex-column gap-2">
                    {[
                      { href: '#features', label: 'Features' },
                      { href: '#workflow', label: 'How It Works' },
                      { href: '#playground', label: 'Playground' },
                      { href: '#deliverability', label: 'Deliverability Model' }
                    ].map((item) => (
                      <a key={item.href} href={item.href} className="lp-footer-link">{item.label}</a>
                    ))}
                  </div>
                </motion.div>
              </Col>

              <Col xs={6} lg={4}>
                <motion.div variants={fadeInUp}>
                  <h6 className="text-white fw-bold mb-3">Security &amp; Auth</h6>
                  <div className="d-flex flex-column gap-2">
                    <Link to="/login" className="lp-footer-link">Sign In</Link>
                    <Link to="/signup" className="lp-footer-link">Create Account</Link>
                    <a href="https://supabase.com/docs/guides/database/vault" target="_blank" rel="noopener noreferrer" className="lp-footer-link">
                      Supabase Vault Docs <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} />
                    </a>
                  </div>
                </motion.div>
              </Col>
            </Row>
          </motion.div>

          <div className="d-flex flex-wrap justify-content-between align-items-center text-secondary small">
            <div>&copy; {new Date().getFullYear()} Reachy Inc. All rights reserved.</div>
            <div className="d-flex gap-3 mt-2 mt-sm-0">
              <a href="#" className="lp-footer-link small">Privacy Policy</a>
              <a href="#" className="lp-footer-link small">Terms of Service</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
