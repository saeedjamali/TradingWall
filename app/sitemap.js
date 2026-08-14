import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { absoluteUrl, resolveSiteUrl } from '@/utils/site'

export const revalidate = 0 // always fresh — never cache wrong localhost URLs
export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const siteUrl = await resolveSiteUrl()
  const now = new Date()

  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/leaderboards', siteUrl),
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
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
      url: absoluteUrl(`/wall/${u._id}`, siteUrl),
      lastModified: u.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Sitemap wall entries skipped:', error?.message || error)
  }

  return [...staticRoutes, ...wallRoutes]
}
