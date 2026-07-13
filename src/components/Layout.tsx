import { useState, useEffect } from 'react'
import { Container, Stack } from 'react-bootstrap'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { signOut } from '../store/authSlice'
import { useToast } from '../hooks/useToast'
import { ConfirmModal } from './ConfirmModal'
import { BrandLogo } from './BrandLogo'
import type { RootState, AppDispatch } from '../store'

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 72

const BREAKPOINT = 768

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/recipients', label: 'Recipients', icon: 'bi-people', end: false },
  { to: '/compose', label: 'Compose', icon: 'bi-envelope-paper', end: false },
]

const bottomLink = { to: '/settings', label: 'Settings', icon: 'bi-gear', end: false }

export function Layout() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < BREAKPOINT
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closeMobile = () => {
    if (isMobile) setMobileOpen(false)
  }

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  const handleLogout = async () => {
    setLoggingOut(true)
    const result = await dispatch(signOut())
    if (signOut.fulfilled.match(result)) {
      toast('Signed out successfully', 'info')
      navigate('/login', { replace: true })
    } else {
      toast('Failed to sign out', 'error')
    }
    setLoggingOut(false)
    setShowLogoutModal(false)
  }

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link visually-hidden-focusable">Skip to content</a>
      {isMobile && (
        <header className="mobile-topbar">
<div className="mobile-brand">
            <BrandLogo size={32} />
            <span className="brand-name">Reachy</span>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
          </button>
        </header>
      )}

      {isMobile && mobileOpen && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

        <motion.aside
          className={collapsed && !isMobile ? 'sidebar is-collapsed' : 'sidebar'}
          animate={
            isMobile
              ? { x: mobileOpen ? 0 : '-100%' }
              : { width: sidebarWidth }
          }
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="sidebar-header">
<div className="sidebar-brand">
            <BrandLogo size={36} />
            {(!collapsed || isMobile) && <span className="brand-name">Reachy</span>}
          </div>
            <motion.button
              className="sidebar-toggle"
              onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(!collapsed))}
              whileTap={{ scale: 0.9 }}
              aria-label={isMobile ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`bi ${isMobile ? 'bi-x-lg' : collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
            </motion.button>
          </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="sidebar-link"
              onClick={closeMobile}
            >
              <i className={`bi ${link.icon} sidebar-link-icon`} />
              <AnimatePresence initial={false}>
                {(!collapsed || isMobile) && (
                  <motion.span
                    className="sidebar-link-label"
                    initial={isMobile ? false : { opacity: 0, width: 0 }}
                    animate={isMobile ? {} : { opacity: 1, width: 'auto' }}
                    exit={isMobile ? undefined : { opacity: 0, width: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to={bottomLink.to}
            end={bottomLink.end}
            className="sidebar-link"
            onClick={closeMobile}
          >
            <i className={`bi ${bottomLink.icon} sidebar-link-icon`} />
            <AnimatePresence initial={false}>
              {(!collapsed || isMobile) && (
                <motion.span
                  className="sidebar-link-label"
                  initial={isMobile ? false : { opacity: 0, width: 0 }}
                  animate={isMobile ? {} : { opacity: 1, width: 'auto' }}
                  exit={isMobile ? undefined : { opacity: 0, width: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {bottomLink.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        </div>

        <div className="sidebar-footer">
          {user && (
            <>
              <motion.button
                className={`sidebar-logout ${(!collapsed || isMobile) ? '' : 'sidebar-logout-collapsed'}`}
                onClick={() => setShowLogoutModal(true)}
                whileTap={{ scale: 0.9 }}
                title="Sign out"
              >
                <i className="bi bi-box-arrow-right" />
                <AnimatePresence initial={false}>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      className="sidebar-logout-label"
                      initial={isMobile ? false : { opacity: 0, width: 0 }}
                      animate={isMobile ? {} : { opacity: 1, width: 'auto' }}
                      exit={isMobile ? undefined : { opacity: 0, width: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      Sign out
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <div className="sidebar-user">
                <div className="sidebar-avatar">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <AnimatePresence initial={false}>
                  {(!collapsed || isMobile) && (
                    <motion.div
                      className="sidebar-user-info"
                      initial={isMobile ? false : { opacity: 0 }}
                      animate={isMobile ? {} : { opacity: 1 }}
                      exit={isMobile ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="sidebar-user-email" title={user.email}>
                        {user.email}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </motion.aside>

      <motion.div
        className="main-area"
        animate={isMobile ? { marginLeft: 0 } : { marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <main id="main-content" className="page-container">
          <Outlet />
        </main>

        <footer className="bg-white border-top py-3">
          <Container>
            <Stack direction="horizontal" gap={3} className="justify-content-center text-muted small">
              <i className="bi bi-shield-check" />
              <span>Reachy — Cold-email automation</span>
              <span className="text-border" style={{ width: 1, height: 14, background: 'var(--reachy-border-color)' }} />
              <a href="https://github.com/abdulbarry-dev/reachy" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-muted" aria-label="GitHub">
                <i className="bi bi-github" aria-hidden="true"></i>
              </a>
              <a href="https://x.com/AbdulbarryG" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-muted" aria-label="X (Twitter)">
                <i className="bi bi-twitter-x" aria-hidden="true"></i>
              </a>
              <a href="https://www.linkedin.com/in/abdulbarryguenichi/" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-muted" aria-label="LinkedIn">
                <i className="bi bi-linkedin" aria-hidden="true"></i>
              </a>
            </Stack>
          </Container>
        </footer>
      </motion.div>

      <ConfirmModal
        show={showLogoutModal}
        title="Sign out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign out"
        icon="bi-box-arrow-right"
        confirmVariant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  )
}
