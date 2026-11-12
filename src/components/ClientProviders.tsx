'use client'

import { useEffect, type ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { SWRConfig } from 'swr'
import { MotionConfig } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { StoreProvider } from '../store/StoreProvider'
import { ToastProvider } from './ToastProvider'
import { supabase } from '../lib/supabase'
import { setUser, finishBootstrap } from '../store/authSlice'
import type { AppDispatch } from '../store'

const swrConfig = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        dispatch(setUser(session?.user ?? null))
        dispatch(finishBootstrap())
      })
      .catch(() => {
        dispatch(finishBootstrap())
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return <>{children}</>
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AuthInitializer>
        <SWRConfig value={swrConfig}>
          <ToastProvider>
            <MotionConfig reducedMotion="user">
              {children}
              <Analytics />
            </MotionConfig>
          </ToastProvider>
        </SWRConfig>
      </AuthInitializer>
    </StoreProvider>
  )
}
