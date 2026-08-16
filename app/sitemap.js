import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { PRODUCTION_SITE_URL } from '@/utils/site'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Sitemap always uses the live public domain.
 * Do not derive from Host / localhost proxy — Google rejects those URLs.
 */
export default async function sitemap() {
  const siteUrl = PRODUCTION_SITE_URL
  const now = new Date()

  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/leaderboards`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/tools/market-clock`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tools/risk-calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tools/calculators`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tools/session-overlap`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/tools/pair-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/backtest`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ]

  let wallRoutes = []
  try {
    await connectDB()
    const publicUsers = await User.find({
      'privacySettings.isPublic': true,
      isActive: { $ne: false },
    })
      .select('_id updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean()

    wallRoutes = publicUsers.map((u) => ({
      url: `${siteUrl}/wall/${u._id}`,
      lastModified: u.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Sitemap wall entries skipped:', error?.message || error)
  }

  return [...staticRoutes, ...wallRoutes]
}
