import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { absoluteUrl, getSiteUrl } from '@/utils/site'

export const revalidate = 3600 // refresh sitemap hourly

export default async function sitemap() {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/leaderboards'),
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
      url: absoluteUrl(`/wall/${u._id}`),
      lastModified: u.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Sitemap wall entries skipped:', error?.message || error)
  }

  return [...staticRoutes, ...wallRoutes]
}
