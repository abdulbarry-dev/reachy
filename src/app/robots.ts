import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/recipients',
          '/compose',
          '/settings',
          '/campaigns/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://reachy.app/sitemap.xml',
  }
}
