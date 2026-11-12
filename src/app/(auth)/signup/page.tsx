import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Auth } from '../../../views/Auth'
import { AuthLoadingSkeleton } from '../../../components/AuthLoadingSkeleton'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free Reachy account and start automating cold email deliverability.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <Auth mode="signup" />
    </Suspense>
  )
}
