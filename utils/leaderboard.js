import Trade from '@/models/Trade'
import User from '@/models/User'
import LeaderboardSnapshot from '@/models/LeaderboardSnapshot'
import Achievement from '@/models/Achievement'
import {
  buildPeriodInfo,
  getPreviousPeriodDate,
} from '@/utils/periods'

export const MIN_TRADES = {
  week: 5,
  month: 20,
  year: 220,
}

export const LIVE_CACHE_MS = 24 * 60 * 60 * 1000 // 1 day

const METRICS = ['winrate', 'profit']
const PERIOD_TYPES = ['week', 'month', 'year']

export {
  buildPeriodInfo,
  getPreviousPeriodDate,
  getWeekNumber,
  getWeekRange,
  getMonthRange,
  getYearRange,
  listWeeksInMonth,
  MONTH_NAMES,
} from '@/utils/periods'


/**
 * Aggregate top traders for a date range
 */
export async function computeLeaderboard(metric, periodType, startDate, endDate, limit = 10) {
  const minTrades = MIN_TRADES[periodType]

  const sortField = metric === 'winrate' ? { winRate: -1, tradeCount: -1 } : { totalProfit: -1, tradeCount: -1 }

  const rows = await Trade.aggregate([
    {
      $match: {
        closeTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$userId',
        tradeCount: { $sum: 1 },
        wins: {
          $sum: {
            $cond: [{ $gt: ['$profit', 0] }, 1, 0],
          },
        },
        totalProfit: { $sum: '$profit' },
      },
    },
    { $match: { tradeCount: { $gte: minTrades } } },
    {
      $addFields: {
        winRate: {
          $cond: [
            { $gt: ['$tradeCount', 0] },
            { $multiply: [{ $divide: ['$wins', '$tradeCount'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: sortField },
    { $limit: limit },
  ])

  if (rows.length === 0) return []

  const userIds = rows.map((r) => r._id)
  const users = await User.find({ _id: { $in: userIds } })
    .select('publicName verified privacySettings')
    .lean()
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))

  return rows.map((row, index) => {
    const user = userMap[row._id.toString()] || {}
    return {
      userId: row._id,
      publicName: user.publicName || 'کاربر',
      verified: !!user.verified,
      wallPublic: !!user.privacySettings?.isPublic,
      rank: index + 1,
      value: metric === 'winrate'
        ? Number(row.winRate.toFixed(2))
        : Number(row.totalProfit.toFixed(2)),
      tradeCount: row.tradeCount,
      wins: row.wins,
    }
  })
}

/**
 * Get live board for current period — uses 24h cache
 */
export async function getLiveBoard(metric, periodType, now = new Date()) {
  const info = buildPeriodInfo(periodType, now)

  const cached = await LeaderboardSnapshot.findOne({
    metric,
    periodType,
    periodKey: info.periodKey,
    isFinal: false,
  }).lean()

  if (cached && cached.computedAt && (now - new Date(cached.computedAt)) < LIVE_CACHE_MS) {
    return {
      ...info,
      metric,
      isFinal: false,
      entries: cached.entries,
      computedAt: cached.computedAt,
      fromCache: true,
      minTrades: MIN_TRADES[periodType],
    }
  }

  const entries = await computeLeaderboard(
    metric,
    periodType,
    info.startDate,
    info.endDate,
    10
  )

  await LeaderboardSnapshot.findOneAndUpdate(
    {
      metric,
      periodType,
      periodKey: info.periodKey,
      isFinal: false,
    },
    {
      metric,
      periodType,
      periodKey: info.periodKey,
      periodLabel: info.periodLabel,
      year: info.year,
      month: info.month,
      week: info.week,
      startDate: info.startDate,
      endDate: info.endDate,
      isFinal: false,
      entries,
      computedAt: now,
    },
    { upsert: true, new: true }
  )

  return {
    ...info,
    metric,
    isFinal: false,
    entries,
    computedAt: now,
    fromCache: false,
    minTrades: MIN_TRADES[periodType],
  }
}

export async function getAllLiveBoards(now = new Date()) {
  const boards = {}
  for (const metric of METRICS) {
    boards[metric] = {}
    for (const periodType of PERIOD_TYPES) {
      boards[metric][periodType] = await getLiveBoard(metric, periodType, now)
    }
  }
  return boards
}

/**
 * Finalize a closed period: save snapshot + achievements
 */
export async function archivePeriod(metric, periodType, dateInPeriod) {
  const info = buildPeriodInfo(periodType, dateInPeriod)

  const existing = await LeaderboardSnapshot.findOne({
    metric,
    periodType,
    periodKey: info.periodKey,
    isFinal: true,
  })
  if (existing) {
    return { alreadyExists: true, snapshot: existing }
  }

  // Don't finalize if period hasn't ended yet
  const now = new Date()
  if (info.endDate >= now) {
    return { skipped: true, reason: 'period_not_ended' }
  }

  const entries = await computeLeaderboard(
    metric,
    periodType,
    info.startDate,
    info.endDate,
    10
  )

  const snapshot = await LeaderboardSnapshot.findOneAndUpdate(
    {
      metric,
      periodType,
      periodKey: info.periodKey,
      isFinal: true,
    },
    {
      metric,
      periodType,
      periodKey: info.periodKey,
      periodLabel: info.periodLabel,
      year: info.year,
      month: info.month,
      week: info.week,
      startDate: info.startDate,
      endDate: info.endDate,
      isFinal: true,
      entries,
      computedAt: now,
    },
    { upsert: true, new: true }
  )

  // Create achievements for top 10
  const category = `${metric}_${periodType}` // winrate_week, profit_month, ...
  for (const entry of entries) {
    const periodFilter = {
      userId: entry.userId,
      category,
      'period.year': info.year,
    }
    if (periodType === 'month') periodFilter['period.month'] = info.month
    if (periodType === 'week') {
      periodFilter['period.month'] = info.month
      periodFilter['period.week'] = info.week
    }

    const periodData = { year: info.year }
    if (periodType === 'month' || periodType === 'week') periodData.month = info.month
    if (periodType === 'week') periodData.week = info.week

    await Achievement.findOneAndUpdate(
      periodFilter,
      {
        userId: entry.userId,
        category,
        rank: entry.rank,
        value: entry.value,
        period: periodData,
      },
      { upsert: true, new: true }
    )
  }

  // Remove live cache for that key if any
  await LeaderboardSnapshot.deleteMany({
    metric,
    periodType,
    periodKey: info.periodKey,
    isFinal: false,
  })

  return { alreadyExists: false, snapshot }
}

/**
 * Archive all recently ended periods (lazy cron)
 */
export async function archiveEndedPeriods(now = new Date()) {
  const results = []
  for (const periodType of PERIOD_TYPES) {
    const prevDate = getPreviousPeriodDate(periodType, now)
    for (const metric of METRICS) {
      const result = await archivePeriod(metric, periodType, prevDate)
      results.push({ metric, periodType, ...result })
    }
  }
  return results
}

export async function getHistoryBoards({
  metric,
  periodType,
  year,
  month,
  week,
  periodKey,
  periodKeys,
  limit = 12,
} = {}) {
  const query = { isFinal: true }
  if (metric) query.metric = metric
  if (periodType) query.periodType = periodType
  if (year != null && year !== '') query.year = Number(year)
  if (month != null && month !== '') query.month = Number(month)
  if (week != null && week !== '') query.week = Number(week)
  if (periodKey) query.periodKey = periodKey
  if (periodKeys?.length) query.periodKey = { $in: periodKeys }

  const snapshots = await LeaderboardSnapshot.find(query)
    .sort({ year: -1, month: -1, week: -1, periodKey: -1 })
    .limit(limit)
    .lean()

  return snapshots
}

export function formatLeaderboardValue(metric, value) {
  if (metric === 'winrate') return `${Number(value).toFixed(1)}%`
  const n = Number(value)
  const sign = n >= 0 ? '' : '-'
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

export { METRICS, PERIOD_TYPES }
