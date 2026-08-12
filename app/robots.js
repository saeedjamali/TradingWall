import { getSiteUrl } from '@/utils/site'

export default function robots() {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/leaderboards', '/wall/'],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/api/',
          '/uploads/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/leaderboards', '/wall/'],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/api/',
          '/uploads/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
