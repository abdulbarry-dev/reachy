import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Auth } from '../../../views/Auth'
import { AuthLoadingSkeleton } from '../../../components/AuthLoadingSkeleton'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Reachy account password.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <Auth mode="reset-password" />
    </Suspense>
  )
}
