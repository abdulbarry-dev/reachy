import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Auth } from '../../../views/Auth'
import { AuthLoadingSkeleton } from '../../../components/AuthLoadingSkeleton'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your Reachy cold email automation dashboard.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <Auth mode="login" />
    </Suspense>
  )
}
