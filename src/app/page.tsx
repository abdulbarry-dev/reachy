import type { Metadata, Viewport } from 'next'
import { LandingPage } from '../views/LandingPage'

export const viewport: Viewport = {
  themeColor: '#070a12',
}

export const metadata: Metadata = {
  title: 'Reachy - Modern Cold Email Automation',
  description:
    'Deliverability-first cold email automation with Gmail SMTP, atomic rate limits, and Supabase Vault credential security.',
  alternates: {
    canonical: 'https://reachy.app',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reachy',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  description:
    'Deliverability-first cold email automation with Gmail SMTP, atomic rate limits, and Supabase Vault credential security.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
