import type { NextConfig } from 'next'

/**
 * `VITE_*` names are still accepted for older `.env` files. Next.js only ships
 * `NEXT_PUBLIC_*` values to the browser, so the legacy names are mapped here —
 * the one place a rename takes effect in both server and client bundles.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Origins the browser may call: the configured project (local or hosted) plus its realtime socket. */
function supabaseConnectSources(url: string): string[] {
  if (!URL.canParse(url)) return ['https://*.supabase.co', 'wss://*.supabase.co']
  const { origin, host, protocol } = new URL(url)
  return [origin, `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`]
}

const isDev = process.env.NODE_ENV !== 'production'

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; 'unsafe-eval' is only needed by the dev overlay.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseConnectSources(supabaseUrl).join(' ')} https://va.vercel-scripts.com`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  experimental: {
    // Rewrites `import { X } from 'react-bootstrap'` to per-component imports.
    optimizePackageImports: ['react-bootstrap', 'framer-motion'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
