import { useState, useEffect } from 'react'
import { Container, Stack } from 'react-bootstrap'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { signOut } from '../store/authSlice'
import { useToast } from './ToastProvider'
import { ConfirmModal } from './ConfirmModal'
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
            <svg className="brand-logo" viewBox="0 0 340 350" xmlns="http://www.w3.org/2000/svg" aria-label="Reachy">
              <g transform="translate(0.000000,350.000000) scale(0.100000,-0.100000)" fill="currentColor">
                <path d="M511 3255 c-82 -187 -117 -386 -108 -623 8 -224 65 -406 173 -553 44 -61 163 -172 214 -201 22 -13 40 -25 40 -28 0 -3 -35 -13 -77 -23 -200 -45 -406 -177 -526 -337 -43 -57 -147 -247 -147 -269 0 -7 30 -11 83 -11 107 0 252 -22 352 -54 108 -34 253 -118 332 -191 61 -56 66 -64 70 -111 6 -55 -9 -94 -54 -148 -56 -68 -186 -147 -322 -196 -94 -35 -93 -36 -61 75 30 107 94 227 156 294 l55 59 -28 20 c-43 30 -90 52 -110 52 -36 0 -135 -126 -178 -226 -28 -65 -65 -175 -79 -239 -19 -81 -40 -254 -32 -262 10 -10 155 15 253 43 48 14 138 49 198 78 171 82 276 171 331 279 14 26 29 45 34 42 5 -3 26 -35 46 -71 55 -99 93 -228 112 -386 13 -114 19 -137 31 -133 43 17 207 123 267 173 133 112 248 281 303 448 20 60 35 141 46 256 l6 56 77 58 c105 80 301 271 377 369 156 200 260 407 330 660 37 131 64 184 121 234 50 44 107 65 206 77 32 3 58 10 58 14 0 18 -68 96 -110 127 -57 40 -72 55 -121 121 -45 59 -106 102 -183 129 -66 23 -207 22 -296 -1 -244 -65 -545 -188 -684 -281 l-53 -35 -109 66 c-60 36 -154 88 -209 116 -162 82 -254 136 -361 214 -136 99 -237 200 -313 314 -35 52 -64 96 -66 98 -1 1 -21 -40 -44 -93z m174 -333 c112 -106 266 -207 540 -353 382 -204 489 -298 563 -498 20 -53 26 -91 30 -197 7 -191 -22 -318 -99 -432 l-31 -45 34 29 c50 43 118 126 159 195 48 79 79 175 89 278 l9 85 102 102 102 103 46 -39 c25 -22 47 -38 49 -36 3 4 72 305 72 317 0 7 -309 -68 -319 -78 -3 -2 14 -23 37 -46 l42 -43 -79 -78 c-43 -43 -81 -74 -83 -70 -3 5 -11 27 -18 49 -18 57 -55 120 -118 199 -64 80 -68 70 57 134 165 86 485 196 602 209 31 3 72 3 91 -1 50 -9 121 -59 153 -108 l28 -42 -24 -15 c-102 -66 -148 -145 -211 -359 -49 -167 -98 -283 -172 -407 -198 -331 -526 -605 -1001 -837 l-148 -72 -34 40 c-19 21 -46 54 -60 72 l-26 33 100 102 c117 119 156 176 185 270 52 173 -14 357 -167 464 l-29 21 59 78 c33 44 114 136 182 205 l123 126 -53 26 c-108 54 -98 56 -189 -31 -70 -67 -185 -202 -254 -298 l-21 -29 -81 49 c-122 74 -214 171 -267 281 -41 87 -59 135 -48 135 3 0 32 -25 66 -55 42 -38 99 -74 182 -115 170 -83 155 -83 187 4 l26 74 -71 32 c-103 47 -228 132 -281 191 -55 62 -112 173 -127 251 -11 53 -5 208 8 208 3 0 42 -35 88 -78z m434 -1238 c22 -19 49 -54 60 -78 28 -57 28 -155 1 -215 -20 -42 -194 -231 -233 -253 -15 -8 -30 -2 -73 26 -30 20 -54 43 -54 51 0 36 165 386 228 483 19 29 25 28 71 -14z m-279 -9 c0 -3 -19 -42 -42 -88 -23 -45 -63 -131 -89 -192 -26 -60 -51 -109 -56 -107 -4 1 -41 13 -81 27 -40 14 -106 31 -147 38 -41 6 -75 15 -75 19 0 4 28 37 61 73 95 101 218 177 354 216 68 20 75 21 75 14z m851 -826 c-38 -150 -138 -313 -247 -401 -48 -39 -64 -41 -64 -6 0 28 -67 227 -87 257 -12 18 -13 26 -4 29 27 9 320 161 366 190 28 17 51 27 53 22 2 -5 -6 -46 -17 -91z"/>
              </g>
            </svg>
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
              ? { x: mobileOpen ? 0 : -(SIDEBAR_EXPANDED + 20) }
              : { width: sidebarWidth }
          }
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="sidebar-header">
            <div className="sidebar-brand">
            <svg className="brand-logo" viewBox="0 0 340 350" xmlns="http://www.w3.org/2000/svg" aria-label="Reachy">
              <g transform="translate(0.000000,350.000000) scale(0.100000,-0.100000)" fill="currentColor">
                <path d="M511 3255 c-82 -187 -117 -386 -108 -623 8 -224 65 -406 173 -553 44 -61 163 -172 214 -201 22 -13 40 -25 40 -28 0 -3 -35 -13 -77 -23 -200 -45 -406 -177 -526 -337 -43 -57 -147 -247 -147 -269 0 -7 30 -11 83 -11 107 0 252 -22 352 -54 108 -34 253 -118 332 -191 61 -56 66 -64 70 -111 6 -55 -9 -94 -54 -148 -56 -68 -186 -147 -322 -196 -94 -35 -93 -36 -61 75 30 107 94 227 156 294 l55 59 -28 20 c-43 30 -90 52 -110 52 -36 0 -135 -126 -178 -226 -28 -65 -65 -175 -79 -239 -19 -81 -40 -254 -32 -262 10 -10 155 15 253 43 48 14 138 49 198 78 171 82 276 171 331 279 14 26 29 45 34 42 5 -3 26 -35 46 -71 55 -99 93 -228 112 -386 13 -114 19 -137 31 -133 43 17 207 123 267 173 133 112 248 281 303 448 20 60 35 141 46 256 l6 56 77 58 c105 80 301 271 377 369 156 200 260 407 330 660 37 131 64 184 121 234 50 44 107 65 206 77 32 3 58 10 58 14 0 18 -68 96 -110 127 -57 40 -72 55 -121 121 -45 59 -106 102 -183 129 -66 23 -207 22 -296 -1 -244 -65 -545 -188 -684 -281 l-53 -35 -109 66 c-60 36 -154 88 -209 116 -162 82 -254 136 -361 214 -136 99 -237 200 -313 314 -35 52 -64 96 -66 98 -1 1 -21 -40 -44 -93z m174 -333 c112 -106 266 -207 540 -353 382 -204 489 -298 563 -498 20 -53 26 -91 30 -197 7 -191 -22 -318 -99 -432 l-31 -45 34 29 c50 43 118 126 159 195 48 79 79 175 89 278 l9 85 102 102 102 103 46 -39 c25 -22 47 -38 49 -36 3 4 72 305 72 317 0 7 -309 -68 -319 -78 -3 -2 14 -23 37 -46 l42 -43 -79 -78 c-43 -43 -81 -74 -83 -70 -3 5 -11 27 -18 49 -18 57 -55 120 -118 199 -64 80 -68 70 57 134 165 86 485 196 602 209 31 3 72 3 91 -1 50 -9 121 -59 153 -108 l28 -42 -24 -15 c-102 -66 -148 -145 -211 -359 -49 -167 -98 -283 -172 -407 -198 -331 -526 -605 -1001 -837 l-148 -72 -34 40 c-19 21 -46 54 -60 72 l-26 33 100 102 c117 119 156 176 185 270 52 173 -14 357 -167 464 l-29 21 59 78 c33 44 114 136 182 205 l123 126 -53 26 c-108 54 -98 56 -189 -31 -70 -67 -185 -202 -254 -298 l-21 -29 -81 49 c-122 74 -214 171 -267 281 -41 87 -59 135 -48 135 3 0 32 -25 66 -55 42 -38 99 -74 182 -115 170 -83 155 -83 187 4 l26 74 -71 32 c-103 47 -228 132 -281 191 -55 62 -112 173 -127 251 -11 53 -5 208 8 208 3 0 42 -35 88 -78z m434 -1238 c22 -19 49 -54 60 -78 28 -57 28 -155 1 -215 -20 -42 -194 -231 -233 -253 -15 -8 -30 -2 -73 26 -30 20 -54 43 -54 51 0 36 165 386 228 483 19 29 25 28 71 -14z m-279 -9 c0 -3 -19 -42 -42 -88 -23 -45 -63 -131 -89 -192 -26 -60 -51 -109 -56 -107 -4 1 -41 13 -81 27 -40 14 -106 31 -147 38 -41 6 -75 15 -75 19 0 4 28 37 61 73 95 101 218 177 354 216 68 20 75 21 75 14z m851 -826 c-38 -150 -138 -313 -247 -401 -48 -39 -64 -41 -64 -6 0 28 -67 227 -87 257 -12 18 -13 26 -4 29 27 9 320 161 366 190 28 17 51 27 53 22 2 -5 -6 -46 -17 -91z"/>
              </g>
            </svg>
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
              <span className="text-border" style={{ width: 1, height: 14, background: '#e2e8f0' }} />
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
