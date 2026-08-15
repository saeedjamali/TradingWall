/**
 * Backtest helpers — PnL from TP/SL hit counts
 * Example: 4 TP, 2 SL, risk $10 → (4 - 2) * 10 = +20
 */

export const BACKTEST_SESSIONS = [
  { value: 'asian', label: 'Asian' },
  { value: 'london', label: 'London' },
  { value: 'newyork', label: 'New York' },
  { value: 'overlap', label: 'Overlap' },
  { value: 'other', label: 'سایر' },
]

export const BACKTEST_TIMEFRAMES = [
  'M1',
  'M5',
  'M15',
  'M30',
  'H1',
  'H4',
  'D1',
  'W1',
]

export function computeBacktestPnL(tpHits, slHits, risk) {
  const tp = Math.max(0, Number(tpHits) || 0)
  const sl = Math.max(0, Number(slHits) || 0)
  if (risk === null || risk === undefined || risk === '') return null
  const r = Number(risk)
  if (Number.isNaN(r)) return null
  return Number(((tp - sl) * r).toFixed(2))
}

export function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function sameLocalDay(a, b) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const PREFS_KEY = 'tw_backtest_prefs'

const DEFAULT_PREFS = {
  symbol: '',
  timeframe: 'M15',
  direction: 'buy',
  session: 'london',
  risk: '',
  setupIds: [],
  mode: 'quick',
}

function prefsStorageKey(userId) {
  return userId ? `${PREFS_KEY}_${userId}` : PREFS_KEY
}

/** Last-used form defaults (per user, localStorage) */
export function loadBacktestPrefs(userId) {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }
  try {
    const raw = localStorage.getItem(prefsStorageKey(userId))
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      setupIds: Array.isArray(parsed.setupIds) ? parsed.setupIds : [],
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveBacktestPrefs(userId, fields) {
  if (typeof window === 'undefined') return
  try {
    const prev = loadBacktestPrefs(userId)
    const next = {
      ...prev,
      symbol: fields.symbol ?? prev.symbol,
      timeframe: fields.timeframe ?? prev.timeframe,
      direction: fields.direction ?? prev.direction,
      session: fields.session ?? prev.session,
      risk:
        fields.risk === null || fields.risk === undefined
          ? prev.risk
          : String(fields.risk),
      setupIds: Array.isArray(fields.setupIds)
        ? fields.setupIds.map(String)
        : prev.setupIds,
      mode: fields.mode === 'full' || fields.mode === 'quick' ? fields.mode : prev.mode,
    }
    localStorage.setItem(prefsStorageKey(userId), JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }
}

export function sessionLabel(value) {
  return BACKTEST_SESSIONS.find((s) => s.value === value)?.label || value || '—'
}

/**
 * Aggregate month reports from backtest list
 */
export function buildBacktestReports(backtests) {
  const emptyBucket = () => ({ count: 0, tp: 0, sl: 0, pnl: 0, withRisk: 0 })

  let tp = 0
  let sl = 0
  let pnl = 0
  let withRisk = 0
  let rrSum = 0
  let rrCount = 0
  const bySetup = {}
  const bySession = {}
  const bySymbol = {}
  const byTimeframe = {}
  const byDirection = { buy: emptyBucket(), sell: emptyBucket() }
  const byDay = {}

  for (const b of backtests || []) {
    const bTp = b.tpHits || 0
    const bSl = b.slHits || 0
    const bPnl = b.resultPnL
    tp += bTp
    sl += bSl
    if (bPnl != null) {
      pnl += bPnl
      withRisk += 1
    }
    if (b.rr != null && !Number.isNaN(Number(b.rr))) {
      rrSum += Number(b.rr)
      rrCount += 1
    }

    const bump = (map, key, label) => {
      if (!map[key]) map[key] = { ...emptyBucket(), key, label: label || key }
      map[key].count += 1
      map[key].tp += bTp
      map[key].sl += bSl
      if (bPnl != null) {
        map[key].pnl += bPnl
        map[key].withRisk += 1
      }
    }

    for (const s of b.setupIds || []) {
      const id = String(s._id || s)
      bump(bySetup, id, s.title || 'ستاپ')
    }
    bump(bySession, b.session || 'other', sessionLabel(b.session))
    bump(bySymbol, b.symbol || '—', b.symbol || '—')
    bump(byTimeframe, b.timeframe || '—', b.timeframe || '—')
    bump(byDirection, b.direction === 'sell' ? 'sell' : 'buy', b.direction === 'sell' ? 'Sell' : 'Buy')

    const d = new Date(b.date)
    const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    bump(byDay, dayKey, dayKey)
  }

  const sortRows = (obj) =>
    Object.values(obj).sort((a, b) => b.count - a.count || b.pnl - a.pnl)

  const hitRate = tp + sl > 0 ? (tp / (tp + sl)) * 100 : null
  const unitNet = tp - sl
  const expectancy =
    tp + sl > 0 ? unitNet / (tp + sl) : null /* R-units per hit */
  const avgPnl = withRisk > 0 ? pnl / withRisk : null
  const profitFactor =
    sl > 0 ? tp / sl : tp > 0 ? Infinity : null

  const dayRows = sortRows(byDay)
  const bestDay = dayRows.length
    ? [...dayRows].sort((a, b) => b.pnl - a.pnl)[0]
    : null
  const worstDay = dayRows.length
    ? [...dayRows].sort((a, b) => a.pnl - b.pnl)[0]
    : null
  const activeDays = dayRows.length
  const avgPerDay = activeDays > 0 ? (backtests.length / activeDays).toFixed(1) : null

  return {
    count: (backtests || []).length,
    tp,
    sl,
    pnl,
    withRisk,
    hitRate,
    unitNet,
    expectancy,
    avgPnl,
    profitFactor,
    avgRr: rrCount > 0 ? rrSum / rrCount : null,
    activeDays,
    avgPerDay,
    bestDay,
    worstDay,
    setupRows: sortRows(bySetup),
    sessionRows: sortRows(bySession),
    symbolRows: sortRows(bySymbol),
    timeframeRows: sortRows(byTimeframe),
    directionRows: sortRows(byDirection),
  }
}
