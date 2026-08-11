import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Trade from '@/models/Trade'
import Plan from '@/models/Plan'
import Achievement from '@/models/Achievement'
import Activity from '@/models/Activity'
import Setup from '@/models/Setup'

/**
 * GET /api/wall/[userId]
 * Public user wall — gated by privacySettings.isPublic + section flags
 * Optional: ?month=2026-08 for calendar trades
 */
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
    }

    const user = await User.findById(userId)
      .select('publicName profileImage province city verified privacySettings createdAt')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const privacy = {
      isPublic: false,
      showCalendar: false,
      showAchievements: true,
      showActivities: true,
      showSetups: true,
      allowJobOffers: false,
      ...(user.privacySettings || {}),
    }

    if (!privacy.isPublic) {
      return NextResponse.json({
        success: false,
        private: true,
        error: 'این دیوار کاربری خصوصی است',
        user: {
          id: userId,
          publicName: user.publicName,
          verified: user.verified,
          profileImage: user.profileImage,
        },
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month') // YYYY-MM
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth() // 0-based
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number)
      year = y
      month = m - 1
    }

    const monthStart = new Date(year, month, 1, 0, 0, 0, 0)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const payload = {
      success: true,
      private: false,
      user: {
        id: userId,
        publicName: user.publicName,
        profileImage: user.profileImage,
        province: user.province,
        city: user.city,
        verified: user.verified,
        memberSince: user.createdAt,
      },
      privacy: {
        isPublic: true,
        showCalendar: !!privacy.showCalendar,
        showAchievements: !!privacy.showAchievements,
        showActivities: !!privacy.showActivities,
        showSetups: !!privacy.showSetups,
        allowJobOffers: !!privacy.allowJobOffers,
      },
      calendar: null,
      achievements: null,
      activities: null,
      setups: null,
    }

    if (privacy.showCalendar) {
      const [trades, plans] = await Promise.all([
        Trade.find({
          userId,
          closeTime: { $gte: monthStart, $lte: monthEnd },
        })
          .select('symbol type volume profit closeTime openTime setupIds')
          .sort({ closeTime: -1 })
          .lean(),
        Plan.find({
          userId,
          date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month + 1, 0, 23, 59, 59, 999),
          },
        })
          .select('date period maxTrades maxLoss maxLossPercent targetProfit notes mood')
          .lean(),
      ])

      payload.calendar = {
        year,
        month: month + 1,
        trades,
        plans,
      }
    }

    if (privacy.showAchievements) {
      payload.achievements = await Achievement.find({ userId })
        .sort({ 'period.year': -1, 'period.month': -1, 'period.week': -1, rank: 1 })
        .lean()
    }

    if (privacy.showActivities) {
      payload.activities = await Activity.find({ userId })
        .sort({ date: -1 })
        .lean()
    }

    if (privacy.showSetups) {
      payload.setups = await Setup.find({ type: 'custom', userId })
        .sort({ title: 1 })
        .lean()
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Wall GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
