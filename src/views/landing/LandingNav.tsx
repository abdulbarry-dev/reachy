import { useCallback, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from './landingMotion'
import { LANDING_SECTIONS } from './sections'
import { LogoSvg } from './LogoSvg'

/** Scroll distance before the bar takes on its frosted surface. */
const SETTLE_AT_PX = 24

export interface LandingNavProps {
  /** A session exists — the auth actions become a dashboard link. */
  user: boolean
  /** Section id currently in view, owned by the scroll observer in LandingPage. */
  activeSection: string
}

/**
 * Landing header — crisp daylight navigation over the white/soft-mint hero.
 *
 * - At rest (scrollY <= 24px): transparent with slate typography.
 * - Scrolled (> 24px): frosted white glass with subtle slate hairline & shadow.
 */
export function LandingNav({ user, activeSection }: LandingNavProps) {
  const [settled, setSettled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    const onScroll = () => {
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
      setSettled(scrollY > SETTLE_AT_PX)
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

  const themeClass = 'nav-theme-light'
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
