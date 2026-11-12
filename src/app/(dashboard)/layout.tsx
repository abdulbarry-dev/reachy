'use client'

import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { AuthLoadingSkeleton } from '../../components/AuthLoadingSkeleton'
import { Layout } from '../../components/Layout'
import { Redirect } from '../../components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useSelector((state: RootState) => state.auth.user)
  const bootstrapped = useSelector((state: RootState) => state.auth.bootstrapped)

  if (!bootstrapped) {
    return <AuthLoadingSkeleton />
  }

  if (!user) {
    return <Redirect to="/login" />
  }

  return <Layout>{children}</Layout>
}
