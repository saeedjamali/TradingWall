import Trade from '@/models/Trade'
import Setup from '@/models/Setup'
import ReportCache from '@/models/ReportCache'

export const INSIGHTS_CACHE_MS = 24 * 60 * 60 * 1000
export const INSIGHTS_CACHE_KEY = 'leaderboard-insights-v1'

const MIN_SETUP_TRADES = 10
const TOP_N = 10

function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

/**
 * Cities with most active traders + cities with highest total profit
 * Uses user.city / user.province from profile
 */
export async function computeCityInsights() {
  const rows = await Trade.aggregate([
    {
      $group: {
        _id: '$userId',
        tradeCount: { $sum: 1 },
        totalProfit: { $sum: '$profit' },
        wins: {
          $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.city': { $nin: [null, ''] },
      },
    },
    {
      $group: {
        _id: {
          city: '$user.city',
          province: '$user.province',
        },
        traderCount: { $sum: 1 },
        tradeCount: { $sum: '$tradeCount' },
        totalProfit: { $sum: '$totalProfit' },
        wins: { $sum: '$wins' },
      },
    },
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
  ])

  const mapped = rows.map((r) => ({
    city: r._id.city,
    province: r._id.province || null,
    label: r._id.province ? `${r._id.city}، ${r._id.province}` : r._id.city,
    traderCount: r.traderCount,
    tradeCount: r.tradeCount,
    totalProfit: Number(r.totalProfit.toFixed(2)),
    winRate: Number(r.winRate.toFixed(1)),
  }))

  const byTraders = [...mapped]
    .sort((a, b) => b.traderCount - a.traderCount || b.tradeCount - a.tradeCount)
    .slice(0, TOP_N)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  const byProfit = [...mapped]
    .sort((a, b) => b.totalProfit - a.totalProfit || b.traderCount - a.traderCount)
    .slice(0, TOP_N)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  return { byTraders, byProfit }
}

/**
 * Setups with best performance (profit + win rate)
 * Min sample size to avoid noise
 */
export async function computeSetupInsights() {
  const rows = await Trade.aggregate([
    {
      $match: {
        setupIds: { $exists: true, $type: 'array', $ne: [] },
      },
    },
    { $unwind: '$setupIds' },
    {
      $group: {
        _id: '$setupIds',
        tradeCount: { $sum: 1 },
        wins: {
          $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] },
        },
        losses: {
          $sum: { $cond: [{ $lt: ['$profit', 0] }, 1, 0] },
        },
        totalProfit: { $sum: '$profit' },
        traders: { $addToSet: '$userId' },
      },
    },
    { $match: { tradeCount: { $gte: MIN_SETUP_TRADES } } },
    {
      $addFields: {
        winRate: {
          $cond: [
            { $gt: ['$tradeCount', 0] },
            { $multiply: [{ $divide: ['$wins', '$tradeCount'] }, 100] },
            0,
          ],
        },
        traderCount: { $size: '$traders' },
        avgProfit: {
          $cond: [
            { $gt: ['$tradeCount', 0] },
            { $divide: ['$totalProfit', '$tradeCount'] },
            0,
          ],
        },
      },
    },
    { $sort: { totalProfit: -1, winRate: -1 } },
    { $limit: 30 },
  ])

  if (rows.length === 0) {
    return { byProfit: [], byWinRate: [] }
  }

  const ids = rows.map((r) => r._id)
  const setups = await Setup.find({ _id: { $in: ids } })
    .select('title type')
    .lean()
  const setupMap = Object.fromEntries(setups.map((s) => [s._id.toString(), s]))

  const mapped = rows.map((r) => {
    const setup = setupMap[r._id.toString()] || {}
    return {
      setupId: r._id.toString(),
      title: setup.title || 'ستاپ حذف‌شده',
      setupType: setup.type || 'unknown',
      tradeCount: r.tradeCount,
      traderCount: r.traderCount,
      wins: r.wins,
      losses: r.losses,
      winRate: Number(r.winRate.toFixed(1)),
      totalProfit: Number(r.totalProfit.toFixed(2)),
      avgProfit: Number(r.avgProfit.toFixed(2)),
    }
  })

  const byProfit = [...mapped]
    .sort((a, b) => b.totalProfit - a.totalProfit || b.winRate - a.winRate)
    .slice(0, TOP_N)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  const byWinRate = [...mapped]
    .sort((a, b) => b.winRate - a.winRate || b.tradeCount - a.tradeCount)
    .slice(0, TOP_N)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  return { byProfit, byWinRate, minTrades: MIN_SETUP_TRADES }
}

export async function computeInsightsReport() {
  const [cities, setups] = await Promise.all([
    computeCityInsights(),
    computeSetupInsights(),
  ])

  return {
    cities,
    setups,
    computedAt: new Date(),
    notes: {
      citySource: 'شهر ثبت‌شده در پروفایل کاربر',
      setupMinTrades: MIN_SETUP_TRADES,
    },
  }
}

export async function getInsightsReport(now = new Date()) {
  const cached = await ReportCache.findOne({ key: INSIGHTS_CACHE_KEY }).lean()
  if (
    cached?.computedAt &&
    now - new Date(cached.computedAt) < INSIGHTS_CACHE_MS &&
    cached.data
  ) {
    return { ...cached.data, fromCache: true, computedAt: cached.computedAt }
  }

  const data = await computeInsightsReport()

  await ReportCache.findOneAndUpdate(
    { key: INSIGHTS_CACHE_KEY },
    { key: INSIGHTS_CACHE_KEY, data, computedAt: now },
    { upsert: true, new: true }
  )

  return { ...data, fromCache: false }
}

export { formatMoney }
