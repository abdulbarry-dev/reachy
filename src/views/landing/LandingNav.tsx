import { useCallback, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from './landingMotion'
import { LANDING_SECTIONS } from './sections'
import { LogoSvg } from './LogoSvg'

/** Scroll distance before the bar takes on its frosted surface. */
const SETTLE_AT_PX = 24
/** Distance from hero bottom where the dawn horizon morphs into daylight frosted glass. */
const LIGHT_TRANSITION_TRIGGER_PX = 180

export interface LandingNavProps {
  /** A session exists — the auth actions become a dashboard link. */
  user: boolean
  /** Section id currently in view, owned by the scroll observer in LandingPage. */
  activeSection: string
}

/**
 * Landing header — Context-Aware Chameleon (Option 1).
 *
 * It adapts dynamically to the section currently passing beneath it:
 * - Over dark hero stage (0px): 100% transparent with white text & mint indicators.
 * - Scrolling inside dark hero (>24px up to hero exit): Deep-space dark glass
 *   HUD with frosted blur, mint hairline, and crisp white typography.
 * - Scrolling into light content sections (Features, Playground, etc.): Seamlessly
 *   interpolates to light daylight frosted glass with slate typography.
 */
export function LandingNav({ user, activeSection }: LandingNavProps) {
  const [settled, setSettled] = useState(false)
  const [inLightSection, setInLightSection] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    let lastInLight = false

    const onScroll = () => {
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0

      // STRICT TOP GUARD: When at the top of the page (or during rubber-band overscroll <= 0),
      // the navbar is ALWAYS 100% transparent with white/mint typography over the dark hero cosmos.
      // It must NEVER flip to light theme or dark text at the top.
      if (scrollY <= SETTLE_AT_PX) {
        setSettled(false)
        setInLightSection(false)
        lastInLight = false
        return
      }

      setSettled(true)

      // Detect whether the navbar is currently over a light content section.
      // We inspect the bottom boundary of the hero section relative to the dawn dissolve horizon.
      // Hysteresis buffer (40px) prevents any single-pixel toggling or flicker on boundaries.
      const heroEl = document.getElementById('main-landing-content')
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect()
        if (lastInLight) {
          // Returning back up into dark hero body
          if (rect.bottom > LIGHT_TRANSITION_TRIGGER_PX + 40) {
            lastInLight = false
            setInLightSection(false)
          }
        } else {
          // Crossing dawn horizon down into light content sections
          if (rect.bottom <= LIGHT_TRANSITION_TRIGGER_PX) {
            lastInLight = true
            setInLightSection(true)
          }
        }
      } else {
        // Fallback: estimate viewport height if hero element isn't in DOM
        const fallbackLight = scrollY > (window.innerHeight || 800) - LIGHT_TRANSITION_TRIGGER_PX
        lastInLight = fallbackLight
        setInLightSection(fallbackLight)
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // The drawer covers the page, so page scroll must stop behind it.
  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen, closeDrawer])

  const themeClass = inLightSection ? 'nav-theme-light' : 'nav-theme-dark'
  const scrolledClass = settled ? 'is-scrolled' : ''

  return (
    <>
      <header className={`lp-navbar fixed-top ${themeClass} ${scrolledClass}`}>
        <Container>
          <div className="lp-navbar-inner">
            <Link href="/" className="lp-brand" aria-label="Reachy home">
              <LogoSvg />
              <span>Reachy</span>
            </Link>

            <nav className="lp-nav-desktop" aria-label="Sections">
              {LANDING_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="lp-nav-link"
                  aria-current={activeSection === section.id ? 'true' : undefined}
                >
                  {section.label}
                </a>
              ))}
            </nav>

            <div className="lp-nav-desktop-actions">
              {user ? (
                <Link href="/dashboard" className="btn-lp-nav-cta">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="lp-nav-login">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn-lp-nav-cta">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              className="lp-mobile-menu-btn d-lg-none"
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="lp-mobile-drawer"
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="lp-sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
            />
            <motion.aside
              id="lp-mobile-drawer"
              className="lp-sidebar"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            >
              <div className="lp-sidebar-header">
                <div className="lp-sidebar-brand">
                  <LogoSvg />
                  <span>Reachy</span>
                </div>
                <button
                  className="lp-sidebar-close"
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close menu"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <nav className="lp-sidebar-nav" aria-label="Sections">
                {LANDING_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="lp-sidebar-link"
                    aria-current={activeSection === section.id ? 'true' : undefined}
                    onClick={closeDrawer}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>

              <div className="lp-sidebar-footer">
                {user ? (
                  <Link href="/dashboard" className="lp-sidebar-auth-btn lp-sidebar-auth-btn-primary" onClick={closeDrawer}>
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="lp-sidebar-auth-btn" onClick={closeDrawer}>
                      Log In
                    </Link>
                    <Link href="/signup" className="lp-sidebar-auth-btn lp-sidebar-auth-btn-primary" onClick={closeDrawer}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
