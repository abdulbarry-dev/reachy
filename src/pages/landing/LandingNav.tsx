import { useCallback, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from './landingMotion'
import { LANDING_SECTIONS } from './sections'
import { LogoSvg } from './LogoSvg'

/** Scroll distance before the bar takes on its solid surface. */
const SETTLE_AT_PX = 40

export interface LandingNavProps {
  /** A session exists — the auth actions become a dashboard link. */
  user: boolean
  /** Section id currently in view, owned by the scroll observer in LandingPage. */
  activeSection: string
}

/**
 * Landing header.
 *
 * Deliberately not a floating card: no radius, no elevation, no border while the
 * page is at rest. It is a full-bleed rule of type that shares the hero's exact
 * left and right content edges, and only grows a hairline and a surface once
 * content starts passing beneath it. The accent shows up twice — the current
 * section's underline and the primary action — and nowhere else.
 */
export function LandingNav({ user, activeSection }: LandingNavProps) {
  const [settled, setSettled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    const onScroll = () => setSettled(window.scrollY > SETTLE_AT_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  return (
    <>
      <header className={`lp-navbar fixed-top ${settled ? 'is-scrolled' : ''}`}>
        <Container>
          <div className="lp-navbar-inner">
            <Link to="/" className="lp-brand" aria-label="Reachy home">
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
                <Link to="/dashboard" className="btn-lp-nav-cta">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="lp-nav-login">
                    Log In
                  </Link>
                  <Link to="/signup" className="btn-lp-nav-cta">
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
                  <Link to="/dashboard" className="lp-sidebar-auth-btn lp-sidebar-auth-btn-primary" onClick={closeDrawer}>
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="lp-sidebar-auth-btn" onClick={closeDrawer}>
                      Log In
                    </Link>
                    <Link to="/signup" className="lp-sidebar-auth-btn lp-sidebar-auth-btn-primary" onClick={closeDrawer}>
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
