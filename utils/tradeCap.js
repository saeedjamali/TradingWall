import {
  calculateAverageProfitPerTrade,
  calculateTotalProfitLoss,
  calculateWinRate,
} from '@/utils/tradeAnalysis'

function dayKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function firstTradeTime(trade) {
  const opened = new Date(trade?.openTime || trade?.closeTime || 0).getTime()
  const closed = new Date(trade?.closeTime || trade?.openTime || 0).getTime()
  return { opened, closed }
}

/** Keep the earliest trades of each close-day. Order is open time, then close time. */
export function limitTradesPerDay(trades, limit) {
  const cap = Math.floor(Number(limit))
  if (!Array.isArray(trades) || !Number.isFinite(cap) || cap < 1) return trades || []

  const groups = new Map()
  for (const trade of trades) {
    const key = dayKey(trade?.closeTime || trade?.openTime)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(trade)
  }

  const kept = []
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => {
      const left = firstTradeTime(a)
      const right = firstTradeTime(b)
      if (left.opened !== right.opened) return left.opened - right.opened
      return left.closed - right.closed
    })
    kept.push(...sorted.slice(0, cap))
  }
  return kept
}

export function netStats(trades) {
  const list = trades || []
  const totalProfitLoss = calculateTotalProfitLoss(list)
  return {
    totalTrades: list.length,
    winRate: list.length ? calculateWinRate(list) : 0,
    totalProfitLoss,
    averageProfit: list.length ? calculateAverageProfitPerTrade(list) : 0,
  }
}

export function capReport(trades, limit) {
  const actualTrades = trades || []
  const limitedTrades = limitTradesPerDay(actualTrades, limit)
  const counts = new Map()
  for (const trade of actualTrades) {
    const key = dayKey(trade?.closeTime || trade?.openTime)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let daysOver = 0
  for (const count of counts.values()) {
    if (count > limit) daysOver += 1
  }
  const actual = netStats(actualTrades)
  const limited = netStats(limitedTrades)
  return {
    actual,
    limited,
    daysOver,
    excluded: actual.totalTrades - limited.totalTrades,
    excludedProfit: Number((actual.totalProfitLoss - limited.totalProfitLoss).toFixed(2)),
    deltaProfit: Number((limited.totalProfitLoss - actual.totalProfitLoss).toFixed(2)),
    deltaWinRate: Number((limited.winRate - actual.winRate).toFixed(2)),
  }
}
