import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Button, Form } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import type { RootState } from '../store'
import { HeroSection } from './landing/HeroSection'
import { StarfieldCanvas } from './landing/StarfieldCanvas'
import { LandingNav } from './landing/LandingNav'
import { LogoSvg } from './landing/LogoSvg'
import { LANDING_SECTIONS } from './landing/sections'
import { useLandingScroll } from './landing/useLandingScroll'
import './LandingPage.css'

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
  { first_name: 'Marcus', company: 'Figma', product: 'Design Tools', email: 'marcus@figma.com' },
]

/** Read once at module scope: the footer must not call an impure getter per render. */
const COPYRIGHT_YEAR = new Date().getFullYear()

// ─── Component ───────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeSection, setActiveSection] = useState('')
  const landingRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Interactive template playground
  const [templateText, setTemplateText] = useState(
    'Hi {{first_name}},\n\nI noticed you work at {{company}}. Would you be open to checking out Reachy to automate personalized campaigns for {{product}}?\n\nBest,\nSarah',
  )
  const [selectedRecipientIdx, setSelectedRecipientIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Safety slider
  const [dailySends, setDailySends] = useState(90)

  // ── Active section via IntersectionObserver ──
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    LANDING_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.35 },
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // ── Landing scroll motion (progress, reveals, heading masks, curtains) ──
  useLandingScroll(landingRef, progressBarRef)

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
    if (sends <= 90) {
      return {
        status: 'Safe',
        class: 'status-safe',
        icon: 'bi-shield-check',
        deliverability: '99%',
        desc: 'Ideal for free Gmail accounts. Stays well under behavioral triggers to guarantee inbox delivery.',
      }
    }
    if (sends <= 200) {
      return {
        status: 'Warning',
        class: 'status-warning',
        icon: 'bi-exclamation-triangle',
        deliverability: '82%',
        desc: 'Approaching limits. Google may begin routing high volumes to promotions or temporary delay queues.',
      }
    }
    return {
      status: 'Risky',
      class: 'status-risky',
      icon: 'bi-shield-slash',
      deliverability: '54%',
      desc: 'High risk of ban. Standard Gmail limits are 100/day for manual send behaviors. Spam filters will block you.',
    }
  }

  const safetyInfo = getSafetyInfo(dailySends)

  return (
    <div ref={landingRef} className="landing-wrapper">
      {/* ── Top Scroll Progress Bar (GSAP ScrollTrigger Scrub) ── */}
      <div ref={progressBarRef} className="landing-scroll-progress" aria-hidden="true" />

      {/* ── Decorative Background Blobs ── */}
      <div className="lp-blob lp-blob-1" aria-hidden="true" />
      <div className="lp-blob lp-blob-2" aria-hidden="true" />
      <div className="lp-blob lp-blob-3" aria-hidden="true" />

      {/* ── Navbar ── */}
      <LandingNav user={!!user} activeSection={activeSection} />

      {/* ── Hero Section (GSAP Orbits & QuickTo) ── */}
      <HeroSection />

      {/* ── Integration Logos ── */}
      <section className="py-4">
        <Container>
          <div className="logos-slider-container">
            <span className="small text-uppercase fw-bold text-secondary me-lg-4">
              Secured With:
            </span>
            {[
              { icon: 'bi-google text-danger', label: 'Gmail Integration', code: null },
              { icon: 'bi-shield-lock-fill text-primary', label: 'Supabase Vault', code: null },
              { icon: 'bi-cpu-fill text-warning', label: 'Deno Edge Runtime', code: null },
              { icon: 'bi-clock-history text-success', label: 'Scheduling', code: 'pg_cron' },
            ].map((item) => (
              <div key={item.label} className="logo-item">
                <i className={`bi ${item.icon}`} />
                {item.code ? (
                  <>
                    <span className="logo-code-pill">{item.code}</span> {item.label}
                  </>
                ) : (
                  item.label
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="lp-section">
        <Container>
          <div className="section-header text-center">
            <span className="lp-badge mb-2">Features Suite</span>
            <h2>Designed to Prevent Spam Triggers</h2>
            <p className="text-muted">
              Unlike generic bulk mail tools, Reachy structures every aspect of the send pipeline
              around Gmail security principles.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                badge: 'SECURE',
                icon: 'bi-safe2',
                title: 'Vault Encryption',
                code: null,
                desc: 'Your SMTP credentials are kept out of plaintext databases. They are encrypted using pg_vault and read only inside isolated Edge Functions during dispatch.',
              },
              {
                badge: 'COMPLIANT',
                icon: 'bi-arrow-repeat',
                title: 'Smart Inbox Rotation',
                code: null,
                desc: 'Keep daily sending volumes small (under 90/day) across multiple connected accounts to bypass Gmail spam detection and build long-term IP reputation.',
              },
              {
                badge: 'AUTOMATED',
                icon: 'bi-calendar-check',
                title: 'Dispatching',
                code: 'pg_cron',
                desc: "Our send pipeline isn't a simple loop that runs into timeouts. A postgres scheduler triggers a dispatch tick every 60s, keeping sending rhythmic and natural.",
              },
            ].map((card) => (
              <Col md={4} key={card.title}>
                <div className="feature-card">
                  <div className="feature-badge">{card.badge}</div>
                  <div className="feature-icon-box">
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">
                    {card.code ? (
                      <>
                        <span className="feature-code-tag">{card.code}</span> {card.title}
                      </>
                    ) : (
                      card.title
                    )}
                  </h4>
                  <p className="text-muted mb-0">{card.desc}</p>
                  {card.code && (
                    <div className="dispatch-diagram" aria-hidden="true">
                      <span className="dd-node">
                        <i className="bi bi-database" />
                      </span>
                      <span className="dd-wire">
                        <span className="dd-pulse" />
                      </span>
                      <span className="dd-tick">tick / 60s</span>
                      <span className="dd-wire dd-wire-late">
                        <span className="dd-pulse" />
                      </span>
                      <span className="dd-node">
                        <i className="bi bi-send" />
                      </span>
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Playground ── */}
      <section
        id="playground"
        className="lp-section lp-section-tint"
      >
        <Container>
          <div className="section-header text-center">
            <span className="lp-badge mb-2">Live Playground</span>
            <h2>Personalize Templates Live</h2>
            <p className="text-muted">
              Type custom templates, click variables to insert tags, and toggle between target
              prospects to see personalized text instantly.
            </p>
          </div>

          <div className="widget-container">
            <Row className="g-4">
              <Col lg={6}>
                <div className="pe-lg-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold small text-uppercase text-secondary">
                      1. Dynamic Merge Variables
                    </span>
                    <span className="small text-muted">Click tag to insert</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {['first_name', 'company', 'product'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="widget-var-badge"
                        onClick={() => insertVariable(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-uppercase text-secondary">
                      2. Compose Email Content
                    </Form.Label>
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
                    <div className="fw-bold small text-uppercase text-secondary mb-2">
                      3. Select Target Prospect
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {MOCK_RECIPIENTS.map((r, idx) => (
                        <button
                          key={r.email}
                          type="button"
                          onClick={() => setSelectedRecipientIdx(idx)}
                          className={`lp-prospect-pill ${selectedRecipientIdx === idx ? 'active' : ''}`}
                        >
                          {r.first_name} ({r.company})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={6}>
                <div className="ps-lg-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold small text-uppercase text-secondary">
                      Recipient Preview
                    </span>
                    <span className="small text-muted font-monospace">
                      {MOCK_RECIPIENTS[selectedRecipientIdx].email}
                    </span>
                  </div>

                  <div className="widget-preview-box">
                    <div className="widget-preview-header">
                      <div>
                        <strong>To:</strong> {MOCK_RECIPIENTS[selectedRecipientIdx].first_name}
                        &nbsp;&lt;{MOCK_RECIPIENTS[selectedRecipientIdx].email}&gt;
                      </div>
                      <div>
                        <strong>From:</strong> Sarah @ Reachy Campaigns
                      </div>
                      <div>
                        <strong>Subject:</strong> Quick question regarding{' '}
                        {MOCK_RECIPIENTS[selectedRecipientIdx].company}
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{getRenderedPreview()}</div>
                  </div>

                  <div className="lp-info-banner mt-4 d-flex align-items-start gap-2">
                    <i className="bi bi-info-circle-fill mt-1" aria-hidden="true" />
                    <div className="small">
                      Import columns directly from CSV headers. Reachy automatically validates and
                      inserts values into campaign queues.
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── Workflow Steps ── */}
      <section id="workflow" className="lp-section">
        <Container>
          <div className="section-header text-center">
            <span className="lp-badge mb-2">Simple Setup</span>
            <h2>How Reachy Automated Outbound</h2>
            <p className="text-muted">
              Get running in minutes. Our architecture ensures your cold email campaign stays within
              parameters.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                num: '1',
                title: 'Connect SMTP Link',
                desc: 'Log in, enter your SMTP details and Google App Password. Our connect-email-account Deno script immediately tests validation status.',
                link: 'Set Up Now',
                highlighted: false,
              },
              {
                num: '2',
                title: 'Create & Parse CSV',
                desc: 'Upload CSV list of leads with merge headers. Review variables, write templates with custom merge fields, and set hourly/daily throttle limits.',
                link: 'Upload Contacts',
                highlighted: true,
              },
              {
                num: '3',
                title: 'Auto-pilot Dispatch',
                desc: 'Queue the campaign. Postgres scheduler handles sends one-by-one, pacing delivery at precise sending intervals to keep Google servers happy.',
                link: 'Launch Queue',
                highlighted: false,
              },
            ].map((step) => (
              <Col lg={4} key={step.num}>
                <div className={`step-card ${step.highlighted ? 'highlighted' : ''}`}>
                  <div className="step-num-badge">{step.num}</div>
                  <h4
                    className={`step-title fw-bold mb-3 ${step.highlighted ? 'text-white' : 'text-dark'}`}
                  >
                    {step.title}
                  </h4>
                  <p className="step-desc mb-3">{step.desc}</p>
                  <Link to="/signup" className="step-link">
                    {step.link} <i className="bi bi-chevron-right" />
                  </Link>
                </div>
              </Col>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Deliverability Gauge ── */}
      <section id="deliverability" className="lp-section lp-section-tint">
        <Container>
          <div className="section-header text-center">
            <span className="lp-badge mb-2">Deliverability Advisor</span>
            <h2>Adjust Sending Speed Safely</h2>
            <p className="text-muted">
              Gmail limits and thresholds are behavioral. Slide daily sends to analyze risk factors.
            </p>
          </div>

          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="gauge-card">
                <div className="gauge-cosmos" aria-hidden="true">
                  <StarfieldCanvas className="gauge-stars" starCount={70} />
                  <div className="gauge-aurora gauge-aurora-1" />
                  <div className="gauge-aurora gauge-aurora-2" />
                </div>
                <Row className="align-items-center gauge-content">
                  <Col md={6} className="mb-4 mb-md-0">
                    <h4 className="fw-bold mb-3 text-white">Daily Volume Gauge</h4>
                    <p className="text-secondary small mb-4">
                      Dragging this slider simulates how Google Workspace spam heuristics analyze
                      your outbound behaviors.
                    </p>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-secondary">Target Daily Cap</span>
                        <strong className="text-white" style={{ fontSize: '1.25rem' }}>
                          {dailySends} emails/day
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={dailySends}
                        onChange={(e) => setDailySends(parseInt(e.target.value))}
                        className="slider-custom"
                        aria-label="Daily send volume slider"
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
                      <div className={`status-badge-lg mb-3 ${safetyInfo.class}`}>
                        <i className={`bi ${safetyInfo.icon}`} /> {safetyInfo.status} Status
                      </div>

                      <div className="mb-3">
                        <div className="small text-secondary">ESTIMATED INBOX DELIVERABILITY</div>
                        <div className="display-4 fw-bold text-white">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={safetyInfo.deliverability}
                              initial={{ y: 14, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -14, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                              style={{ display: 'inline-block' }}
                            >
                              {safetyInfo.deliverability}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>
                      <p className="small text-secondary mb-0">{safetyInfo.desc}</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Split Showcase ── */}
      <section className="lp-section">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <div className="split-img-card">
                <img src="/reachy-logo.png" alt="Reachy logo branding" />
                <div className="split-overlay-tag">
                  <span style={{ fontSize: '1.35rem' }}>90 / day</span>
                  <span className="small text-secondary">Maximum Safety Recommended</span>
                </div>
              </div>
            </Col>

            <Col lg={7}>
              <div className="split-text-col">
                <span className="lp-badge mb-3">Branding &amp; Philosophy</span>
                <h2 className="display-6 fw-bold mb-4 text-dark">Crafted for Clean Outreach</h2>
                <p className="text-muted mb-4">
                  We believe cold outreach should be intentional, highly targeted, and technically
                  secure. Reachy is designed so that you cannot accidentally trigger filters. By
                  enforcing strict sending schedules and secure Vault infrastructure, your branding
                  remains spotless.
                </p>

                <div className="row g-3 mb-5">
                  {[
                    {
                      title: 'Clean Domain Health',
                      desc: 'Keep sender accounts off lists by regulating outbound volume.',
                    },
                    {
                      title: 'Fully Auditable Stack',
                      desc: 'Open-source codebase runs entirely inside your control.',
                    },
                    {
                      title: 'Vault-encrypted Secrets',
                      desc: 'Zero plaintext SMTP credential storage in any database row.',
                    },
                    {
                      title: 'Safe by Default',
                      desc: 'Default rate limits keep you under Gmail behavioral thresholds.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="col-sm-6">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i className="bi bi-check-circle-fill text-success" />
                        <strong className="text-dark">{item.title}</strong>
                      </div>
                      <div className="small text-muted">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="split-bottom-cta-banner">
                  <div>
                    <div className="fw-bold text-dark">Ready to improve deliverability?</div>
                    <div className="small text-muted">
                      Launch campaigns with our default safety parameters.
                    </div>
                  </div>
                  <Button className="btn-lp-primary" onClick={() => navigate('/signup')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <Container>
          <Row className="g-4 mb-5 border-bottom border-secondary pb-5">
            <Col lg={4}>
              <div>
                <a href="#" className="lp-footer-brand mb-3">
                  <LogoSvg />
                  <span>Reachy</span>
                </a>
                <p className="small text-secondary mb-3 mt-3">
                  Secure cold email automation designed to respect sending thresholds and safeguard
                  sender credentials.
                </p>
                <div
                  className="d-flex gap-3 text-secondary"
                  style={{ fontSize: '1.25rem' }}
                >
                  {[
                    {
                      icon: 'bi-github',
                      href: 'https://github.com/abdulbarry-dev/reachy',
                      label: 'GitHub',
                    },
                    {
                      icon: 'bi-twitter-x',
                      href: 'https://x.com/AbdulbarryG',
                      label: 'X (Twitter)',
                    },
                    {
                      icon: 'bi-linkedin',
                      href: 'https://www.linkedin.com/in/abdulbarryguenichi/',
                      label: 'LinkedIn',
                    },
                  ].map(({ icon, href, label }) => (
                    <a
                      key={icon}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-secondary"
                      aria-label={label}
                    >
                      <i className={`bi ${icon}`} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </Col>

            <Col xs={6} lg={4}>
              <div>
                <h6 className="text-white fw-bold mb-3">Product</h6>
                <div className="d-flex flex-column gap-2">
                  {[
                    { href: '#features', label: 'Features' },
                    { href: '#workflow', label: 'How It Works' },
                    { href: '#playground', label: 'Playground' },
                    { href: '#deliverability', label: 'Deliverability Model' },
                  ].map((item) => (
                    <a key={item.href} href={item.href} className="lp-footer-link">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </Col>

            <Col xs={6} lg={4}>
              <div>
                <h6 className="text-white fw-bold mb-3">Security &amp; Auth</h6>
                <div className="d-flex flex-column gap-2">
                  <Link to="/login" className="lp-footer-link">
                    Sign In
                  </Link>
                  <Link to="/signup" className="lp-footer-link">
                    Create Account
                  </Link>
                  <a
                    href="https://supabase.com/docs/guides/database/vault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-footer-link"
                  >
                    Supabase Vault Docs{' '}
                    <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} />
                  </a>
                </div>
              </div>
            </Col>
          </Row>

          <div className="d-flex flex-wrap justify-content-between align-items-center text-secondary small">
            <div>&copy; {COPYRIGHT_YEAR} Reachy Inc. All rights reserved.</div>
            <div className="d-flex gap-3 mt-2 mt-sm-0">
              <a href="#" className="lp-footer-link small">
                Privacy Policy
              </a>
              <a href="#" className="lp-footer-link small">
                Terms of Service
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
