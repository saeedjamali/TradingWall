import { PRODUCTION_SITE_URL } from '@/utils/site'

export const dynamic = 'force-dynamic'

export default async function robots() {
  const siteUrl = PRODUCTION_SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/leaderboards',
          '/wall/',
          '/tools',
          '/tools/',
          '/backtest',
          '/challenges',
          '/challenges/',
          '/blog',
          '/blog/',
          '/uploads/blog/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/api/',
          '/uploads/',
          '/challenges/new',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/leaderboards',
          '/wall/',
          '/tools',
          '/tools/',
          '/backtest',
          '/challenges',
          '/challenges/',
          '/blog',
          '/blog/',
          '/uploads/blog/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/api/',
          '/uploads/',
          '/challenges/new',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
