import { useEffect, lazy, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { supabase } from './lib/supabase'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, finishBootstrap } from './store/authSlice'
import { Layout } from './components/Layout'
import { AuthLoadingSkeleton } from './components/AuthLoadingSkeleton'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageFallback } from './components/PageFallback'
import type { RootState, AppDispatch } from './store'

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Recipients = lazy(() => import('./pages/Recipients').then((m) => ({ default: m.Recipients })))
const Compose = lazy(() => import('./pages/Compose').then((m) => ({ default: m.Compose })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const CampaignDetail = lazy(() => import('./pages/CampaignDetail').then((m) => ({ default: m.CampaignDetail })))

function ProtectedRoute() {
  const user = useSelector((state: RootState) => state.auth.user)
  const bootstrapped = useSelector((state: RootState) => state.auth.bootstrapped)

  if (!bootstrapped) {
    return <AuthLoadingSkeleton />
  }
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setUser(session?.user ?? null))
      dispatch(finishBootstrap())
    }).catch(() => {
      dispatch(finishBootstrap())
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          {/* No key: the shell must survive navigation. Protected pages suspend
              inside Layout's own boundary, so only the outlet is replaced. */}
          <Routes>
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
        </Suspense>
      </ErrorBoundary>
    </MotionConfig>
  )
}

export default App