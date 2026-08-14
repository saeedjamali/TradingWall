import { resolveSiteUrl } from '@/utils/site'

export const dynamic = 'force-dynamic'

export default async function robots() {
  const siteUrl = await resolveSiteUrl()

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
