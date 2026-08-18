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
  'M2',
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

/**
 * Aggregate chart/market-reality rows (separate from backtest WR)
 */
export function buildMarketRealityReports(items) {
  const empty = () => ({ count: 0, tp: 0, sl: 0, days: new Set() })
  const bySetup = {}
  const bySymbol = {}
  const byTimeframe = {}
  let tp = 0
  let sl = 0

  for (const item of items || []) {
    const t = Math.max(0, Number(item.tpCount) || 0)
    const s = Math.max(0, Number(item.slCount) || 0)
    tp += t
    sl += s

    const day = new Date(item.date)
    const dayKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`

    const bump = (map, key, label) => {
      if (!map[key]) map[key] = { ...empty(), key, label: label || key }
      map[key].count += 1
      map[key].tp += t
      map[key].sl += s
      map[key].days.add(dayKey)
    }

    const setup = item.setupId
    const setupId = String(setup?._id || setup || '—')
    const setupLabel = setup?.title || 'ستاپ'
    bump(bySetup, setupId, setupLabel)
    bump(bySymbol, item.symbol || '—', item.symbol || '—')
    bump(byTimeframe, item.timeframe || '—', item.timeframe || '—')
  }

  const toRows = (obj) =>
    Object.values(obj)
      .map((r) => {
        const hits = r.tp + r.sl
        return {
          key: r.key,
          label: r.label,
          count: r.count,
          tp: r.tp,
          sl: r.sl,
          activeDays: r.days.size,
          hitRate: hits > 0 ? (r.tp / hits) * 100 : null,
        }
      })
      .sort((a, b) => b.tp - a.tp || b.count - a.count)

  const hits = tp + sl
  return {
    count: (items || []).length,
    tp,
    sl,
    hitRate: hits > 0 ? (tp / hits) * 100 : null,
    setupRows: toRows(bySetup),
    symbolRows: toRows(bySymbol),
    timeframeRows: toRows(byTimeframe),
  }
}

/** Flatten a backtest row for table / export */
export function flattenBacktestForExport(b) {
  const setups = (b.setupIds || [])
    .map((s) => s.title || s)
    .filter(Boolean)
    .join(' | ')
  const d = new Date(b.date)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    date: dateStr,
    symbol: b.symbol || '',
    timeframe: b.timeframe || '',
    direction: b.direction || '',
    session: sessionLabel(b.session),
    setups,
    marketCondition: b.marketCondition || '',
    entryReason: b.entryReason || '',
    entry: b.entry ?? '',
    sl: b.sl ?? '',
    tp: b.tp ?? '',
    risk: b.risk ?? '',
    rr: b.rr ?? '',
    tpHits: b.tpHits ?? 0,
    slHits: b.slHits ?? 0,
    resultPnL: b.resultPnL ?? '',
    strengths: b.strengths || '',
    weaknesses: b.weaknesses || '',
    lesson: b.lesson || '',
    notes: b.notes || '',
    tradeImage: b.tradeImage || '',
  }
}

export const BACKTEST_EXPORT_HEADERS = [
  { key: 'date', label: 'تاریخ' },
  { key: 'symbol', label: 'نماد' },
  { key: 'timeframe', label: 'تایم‌فریم' },
  { key: 'direction', label: 'جهت' },
  { key: 'session', label: 'سشن' },
  { key: 'setups', label: 'ستاپ‌ها' },
  { key: 'marketCondition', label: 'شرایط بازار' },
  { key: 'entryReason', label: 'دلیل ورود' },
  { key: 'entry', label: 'ورود' },
  { key: 'sl', label: 'SL قیمت' },
  { key: 'tp', label: 'TP قیمت' },
  { key: 'risk', label: 'ریسک $' },
  { key: 'rr', label: 'RR' },
  { key: 'tpHits', label: 'تعداد TP' },
  { key: 'slHits', label: 'تعداد SL' },
  { key: 'resultPnL', label: 'برایند $' },
  { key: 'strengths', label: 'نقاط قوت' },
  { key: 'weaknesses', label: 'نقاط ضعف' },
  { key: 'lesson', label: 'درس' },
  { key: 'notes', label: 'یادداشت' },
  { key: 'tradeImage', label: 'تصویر' },
]

