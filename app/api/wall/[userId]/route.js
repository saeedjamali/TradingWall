import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Trade from '@/models/Trade'
import Plan from '@/models/Plan'
import Achievement from '@/models/Achievement'
import Activity from '@/models/Activity'
import Setup from '@/models/Setup'
import Backtest from '@/models/Backtest'
import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import { requireAdmin } from '@/utils/adminAuth'
import {
  buildChallengeStanding,
  buildTradeChallengeStanding,
  challengeDateBounds,
  getChallengePhase,
  resolveChallengeType,
} from '@/utils/challenge'
import { getChallengeStandings } from '@/utils/challengeStandings'

/**
 * GET /api/wall/[userId]
 * Public user wall — gated by privacySettings.isPublic + section flags
 * Optional: ?month=2026-08 for calendar trades
 * Optional: ?viewerId= — if viewer is admin, private walls are fully visible
 */
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
    }

    const user = await User.findById(userId)
      .select('publicName profileImage province city verified privacySettings createdAt isActive')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const viewerId = searchParams.get('viewerId')
    const adminViewer = viewerId ? await requireAdmin(viewerId) : null
    const isAdminView = !!adminViewer

    const privacy = {
      isPublic: false,
      showCalendar: false,
      showBacktestCalendar: false,
      showChallenges: false,
      showChallengeResults: false,
      showAchievements: true,
      showActivities: true,
      showSetups: true,
      allowJobOffers: false,
      ...(user.privacySettings || {}),
    }

    if (!privacy.isPublic && !isAdminView) {
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

    // Admin can see every section even when owner hid them
    const showCalendar = isAdminView || !!privacy.showCalendar
    const showBacktestCalendar = isAdminView || !!privacy.showBacktestCalendar
    const showChallenges = isAdminView || !!privacy.showChallenges
    const showChallengeResults = isAdminView || !!privacy.showChallengeResults
    const showAchievements = isAdminView || !!privacy.showAchievements
    const showActivities = isAdminView || !!privacy.showActivities
    const showSetups = isAdminView || !!privacy.showSetups

    const payload = {
      success: true,
      private: false,
      adminView: isAdminView,
      user: {
        id: userId,
        publicName: user.publicName,
        profileImage: user.profileImage,
        province: user.province,
        city: user.city,
        verified: user.verified,
        memberSince: user.createdAt,
        isActive: user.isActive !== false,
      },
      privacy: {
        isPublic: !!privacy.isPublic,
        showCalendar,
        showBacktestCalendar,
        showChallenges,
        showChallengeResults,
        showAchievements,
        showActivities,
        showSetups,
        allowJobOffers: isAdminView ? false : !!privacy.allowJobOffers,
      },
      calendar: null,
      backtestCalendar: null,
      challenges: null,
      achievements: null,
      activities: null,
      setups: null,
    }

    if (showCalendar) {
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

    if (showBacktestCalendar) {
      const backtests = await Backtest.find({
        userId,
        date: { $gte: monthStart, $lte: monthEnd },
      })
        .select(
          'date symbol timeframe direction session setupIds tpHits slHits risk resultPnL tradeImage lesson',
        )
        .populate('setupIds', 'title')
        .sort({ date: -1, createdAt: -1 })
        .lean()

      payload.backtestCalendar = {
        year,
        month: month + 1,
        backtests,
      }
    }

    if (showChallenges) {
      const created = await BacktestChallenge.find({ creatorId: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      const parts = await ChallengeParticipant.find({
        userId,
        status: 'approved',
      })
        .populate('challengeId')
        .lean()

      const joined = parts
        .map((p) => p.challengeId)
        .filter((c) => c && String(c.creatorId) !== String(userId))

      const allChallenges = [...created, ...joined]
      const uniq = []
      const seen = new Set()
      for (const ch of allChallenges) {
        const id = String(ch._id)
        if (seen.has(id)) continue
        seen.add(id)
        uniq.push(ch)
      }

      payload.challenges = await Promise.all(
        uniq.slice(0, 15).map(async (ch) => {
          const resolvedType = resolveChallengeType(ch)
          const base = {
            id: String(ch._id),
            inviteCode: ch.inviteCode,
            title: ch.title,
            symbol: ch.symbol,
            type: resolvedType,
            challengeType: resolvedType,
            phase: getChallengePhase(ch),
            role: String(ch.creatorId) === String(userId) ? 'creator' : 'participant',
            challengeEndAt: ch.challengeEndAt,
            result: null,
          }

          if (showChallengeResults) {
            const phase = getChallengePhase(ch)
            let standing = null

            if (phase === 'ended' || phase === 'cancelled') {
              const { standings } = await getChallengeStandings(ch)
              standing =
                standings.find((s) => String(s.userId) === String(userId)) || null
            } else {
              const { start, end } = challengeDateBounds(ch)
              const symbolFilter = {
                $regex: `^${String(ch.symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i',
              }
              if (resolvedType === 'trade') {
                const trades = await Trade.find({
                  userId,
                  symbol: symbolFilter,
                  closeTime: { $gte: start, $lte: end },
                }).lean()
                standing = buildTradeChallengeStanding(user, trades, {
                  start,
                  end,
                })
              } else {
                const backtests = await Backtest.find({
                  userId,
                  symbol: symbolFilter,
                  date: { $gte: start, $lte: end },
                }).lean()
                standing = buildChallengeStanding(user, backtests, {
                  start,
                  end,
                })
              }
            }

            if (standing) {
              base.result = {
                count: standing.count,
                tp: standing.tp,
                sl: standing.sl,
                unitNet: standing.unitNet,
                hitRate: standing.hitRate,
                pnl: standing.pnl,
              }
            }
          }

          return base
        }),
      )
    }

    if (showAchievements) {
      payload.achievements = await Achievement.find({ userId })
        .sort({ 'period.year': -1, 'period.month': -1, 'period.week': -1, rank: 1 })
        .lean()
    }

    if (showActivities) {
      payload.activities = await Activity.find({ userId })
        .sort({ date: -1 })
        .lean()
    }

    if (showSetups) {
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
