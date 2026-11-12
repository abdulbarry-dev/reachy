import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../index.css'
import { ClientProviders } from '../components/ClientProviders'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://reachy.app'),
  title: {
    default: 'Reachy - Modern Cold Email Automation',
    template: '%s | Reachy',
  },
  description:
    'Deliverability-first cold email automation with Gmail SMTP, atomic rate limits, and Supabase Vault credential security.',
  keywords: [
    'cold email',
    'cold email automation',
    'email deliverability',
    'gmail smtp',
    'supabase vault',
    'outbound sales',
  ],
  authors: [{ name: 'Reachy' }],
  creator: 'Reachy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reachy.app',
    siteName: 'Reachy',
    title: 'Reachy - Modern Cold Email Automation',
    description:
      'Deliverability-first cold email automation with Gmail SMTP, atomic rate limits, and Supabase Vault credential security.',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Reachy Cold Email Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reachy - Modern Cold Email Automation',
    description:
      'Deliverability-first cold email automation with Gmail SMTP, atomic rate limits, and Supabase Vault credential security.',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/logo.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className={plusJakartaSans.className} suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
