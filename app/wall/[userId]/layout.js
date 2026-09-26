import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { buildShareMetadata } from '@/utils/shareMeta'

export async function generateMetadata({ params }) {
  const { userId } = await params
  const fallback = {
    title: 'دیوار معاملاتی کاربر',
    description: 'مشاهده تقویم معاملاتی، دستاوردها و ستاپ‌های تریدر در دیوار معاملاتی.',
    robots: { index: false, follow: false },
  }

  if (!userId) return fallback

  try {
    await connectDB()
    const user = await User.findById(userId)
      .select('publicName province city verified privacySettings profileImage isActive')
      .lean()

    if (!user || user.isActive === false) {
      return {
        ...fallback,
        title: 'دیوار یافت نشد',
        robots: { index: false, follow: false },
      }
    }

    const isPublic = !!user.privacySettings?.isPublic
    const name = user.publicName || 'تریدر'
    const location = [user.city, user.province].filter(Boolean).join('، ')
    const description = location
      ? `دیوار معاملاتی ${name} از ${location} — ژورنال، دستاوردها و عملکرد در دیوار معاملاتی.`
      : `دیوار معاملاتی ${name} — ژورنال، دستاوردها و عملکرد در دیوار معاملاتی.`

    return buildShareMetadata({
      title: `دیوار ${name}`,
      description,
      path: `/wall/${userId}`,
      image: user.profileImage,
      imageAlt: name,
      type: 'profile',
      noindex: !isPublic,
    })
  } catch {
    return fallback
  }
}

export default function WallUserLayout({ children }) {
  return children
}
