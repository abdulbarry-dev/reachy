import { useEffect } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { supabase } from './lib/supabase'
import { useDispatch, useSelector } from 'react-redux'
import { setSession, setUser, setAuthLoading } from './store/authSlice'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Recipients } from './pages/Recipients'
import { Compose } from './pages/Compose'
import { Settings } from './pages/Settings'
import { Auth } from './pages/Auth'
import { CampaignDetail } from './pages/CampaignDetail'
import { LandingPage } from './pages/LandingPage'
import { Skeleton } from './components/Skeleton'
import type { RootState, AppDispatch } from './store'

function ProtectedRoute() {
  const { user, loading } = useSelector((state: RootState) => state.auth)
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--reachy-bg-soft)' }}>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="text-center mb-2">
            <div className="d-inline-flex align-items-center gap-2">
              <Skeleton width={32} height={32} borderRadius={8} />
              <Skeleton width={100} height={20} borderRadius={6} />
            </div>
          </div>
          <div className="d-flex gap-3" style={{ padding: '0 24px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ flex: 1 }}>
                <Skeleton width="100%" height={90} borderRadius={16} />
              </div>
            ))}
          </div>
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="40%" height={20} borderRadius={6} />
            {[0, 1].map((i) => (
              <Skeleton key={i} width="100%" height={140} borderRadius={16} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

function App() {
  const dispatch = useDispatch<AppDispatch>()

  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setUser(session?.user ?? null))
      dispatch(setSession(session))
      dispatch(setAuthLoading(false))
    }).catch(() => {
      dispatch(setAuthLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user ?? null))
      dispatch(setSession(session))
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/reset-password" element={<Auth mode="reset-password" />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="recipients" element={<Recipients />} />
            <Route path="compose" element={<Compose />} />
            <Route path="settings" element={<Settings />} />
            <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </MotionConfig>
  )
}

export default App
