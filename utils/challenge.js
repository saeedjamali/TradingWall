import { buildBacktestReports, startOfLocalDay, endOfLocalDay } from '@/utils/backtest'

export const CHALLENGE_TYPES = {
  backtest: {
    key: 'backtest',
    label: 'چالش بک‌تست',
    shortLabel: 'بک‌تست',
    activityLabel: 'بازه چارت',
    windowLabel: 'بازه چالش',
    minLabel: 'پوشش روزانه بک‌تست',
    entriesLabel: 'تعداد بک‌تست',
    unitLabel: 'بک‌تست',
    progressHint:
      'برای هر روز در بازه چارت حداقل یک بک‌تست ثبت کنید. مهلت انجام، بازه چالش است — مثلاً یک ماه چارت را می‌توان در یک هفته بک‌تست کرد.',
  },
  trade: {
    key: 'trade',
    label: 'چالش معامله',
    shortLabel: 'معامله',
    activityLabel: 'بازه معاملات',
    windowLabel: 'بازه چالش',
    minLabel: 'پوشش روزانه معامله',
    entriesLabel: 'تعداد معامله',
    unitLabel: 'معامله',
    progressHint:
      'برای هر روز در بازه معاملات حداقل یک معامله بسته‌شده لازم است. بازه چالش همان بازه معاملات است؛ معامله را نمی‌توان برای روزهای گذشته جلو جلو انجام داد.',
  },
}

export function getChallengeTypeMeta(type) {
  return CHALLENGE_TYPES[type] || CHALLENGE_TYPES.backtest
}

/**
 * Resolve challenge kind from stored fields (and title fallback for older docs).
 */
export function resolveChallengeType(challenge) {
  const raw = challenge?.challengeType || challenge?.type
  if (raw === 'trade' || raw === 'backtest') return raw
  const title = String(challenge?.title || '')
  if (/چالش\s*معامله/i.test(title)) return 'trade'
  if (/چالش\s*بک[\s\-‌]*تست/i.test(title)) return 'backtest'
  return 'backtest'
}

/** True when no one except the creator has joined (pending/approved). */
export async function hasOtherParticipants(challengeId, creatorId, ChallengeParticipant) {
  const count = await ChallengeParticipant.countDocuments({
    challengeId,
    userId: { $ne: creatorId },
    status: { $in: ['pending', 'approved'] },
  })
  return count > 0
}

/** e.g. چالش بک‌تست US30 - September 2026 */
export function buildDefaultChallengeTitle(type, rangeStart, symbol = '') {
  const d = rangeStart instanceof Date ? rangeStart : new Date(rangeStart)
  const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const base = type === 'trade' ? 'چالش معامله' : 'چالش بک‌تست'
  const sym = symbol ? ` ${String(symbol).toUpperCase()}` : ''
  return `${base}${sym} - ${monthYear}`
}

/** Persian + Gregorian (DD/MM/YYYY) date pair for UI */
export function formatDualDate(d) {
  if (!d) return { fa: '—', en: '—', text: '—' }
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return { fa: '—', en: '—', text: '—' }
  const fa = date.toLocaleDateString('fa-IR')
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const en = `${dd}/${mm}/${yyyy}`
  return { fa, en, text: `${fa} · ${en}` }
}

export function formatDualDateRange(start, end) {
  const a = formatDualDate(start)
  const b = formatDualDate(end)
  return {
    fa: `${a.fa} تا ${b.fa}`,
    en: `${a.en} – ${b.en}`,
    text: `${a.fa} تا ${b.fa} (${a.en} – ${b.en})`,
  }
}

/** Local calendar day key YYYY-M-D */
export function localDayKey(d) {
  const x = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(x.getTime())) return null
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
}

/** Inclusive count of calendar days between two dates (local). */
export function countCalendarDaysInRange(start, end) {
  const s = startOfLocalDay(start)
  const e = startOfLocalDay(end)
  if (!s || !e || e < s) return 0
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

/**
 * Progress = days with ≥1 entry / all calendar days in activity range.
 */
export function buildDayCoverageProgress(entryDates, rangeStart, rangeEnd) {
  const totalDays = countCalendarDaysInRange(rangeStart, rangeEnd)
  const covered = new Set()
  for (const d of entryDates || []) {
    const key = localDayKey(d)
    if (key) covered.add(key)
  }
  const coveredDays = Math.min(covered.size, totalDays)
  const progressPct =
    totalDays > 0 ? Math.min(100, Math.round((coveredDays / totalDays) * 100)) : 0
  return {
    totalDays,
    coveredDays,
    progressPct,
    isComplete: totalDays > 0 && coveredDays >= totalDays,
  }
}

/**
 * Aggregate one participant's backtests for a challenge window/symbol
 */
export function buildChallengeStanding(user, backtests, rangeBounds = null) {
  const reports = buildBacktestReports(backtests || [])
  const buy = reports.directionRows.find((r) => r.key === 'buy')
  const sell = reports.directionRows.find((r) => r.key === 'sell')
  const entryDates = (backtests || []).map((b) => b.date)
  const progress = rangeBounds
    ? buildDayCoverageProgress(entryDates, rangeBounds.start, rangeBounds.end)
    : {
        totalDays: reports.activeDays || 0,
        coveredDays: reports.activeDays || 0,
        progressPct: 0,
        isComplete: false,
      }

  return {
    kind: 'backtest',
    userId: String(user._id || user.id),
    publicName: user.publicName || 'کاربر',
    verified: !!user.verified,
    profileImage: user.profileImage || null,
    privacyWallPublic: !!user.privacySettings?.isPublic,
    count: reports.count,
    tp: reports.tp,
    sl: reports.sl,
    wins: reports.tp,
    losses: reports.sl,
    unitNet: reports.unitNet,
    hitRate: reports.hitRate,
    profitFactor: reports.profitFactor,
    expectancy: reports.expectancy,
    pnl: reports.pnl,
    withRisk: reports.withRisk,
    buyCount: buy?.count || 0,
    sellCount: sell?.count || 0,
    buyTp: buy?.tp || 0,
    buySl: buy?.sl || 0,
    sellTp: sell?.tp || 0,
    sellSl: sell?.sl || 0,
    setupRows: rankSetupRows(reports.setupRows, 'backtest').slice(0, 8),
    topSetup: pickTopSetup(reports.setupRows, 'backtest'),
    sessionRows: (reports.sessionRows || []).slice(0, 6),
    activeDays: reports.activeDays,
    totalDays: progress.totalDays,
    coveredDays: progress.coveredDays,
    progressPct: progress.progressPct,
    isComplete: progress.isComplete,
  }
}

/**
 * Aggregate real trades for a trade-challenge window/symbol
 */
export function buildTradeChallengeStanding(user, trades, rangeBounds = null) {
  const list = trades || []
  const wins = list.filter((t) => Number(t.profit) > 0)
  const losses = list.filter((t) => Number(t.profit) < 0)
  const breakeven = list.filter((t) => Number(t.profit) === 0)
  const buy = list.filter((t) => t.type === 'buy')
  const sell = list.filter((t) => t.type === 'sell')
  const buyWins = buy.filter((t) => Number(t.profit) > 0).length
  const buyLosses = buy.filter((t) => Number(t.profit) < 0).length
  const sellWins = sell.filter((t) => Number(t.profit) > 0).length
  const sellLosses = sell.filter((t) => Number(t.profit) < 0).length
  const pnl = list.reduce((s, t) => s + (Number(t.profit) || 0), 0)
  const grossWin = wins.reduce((s, t) => s + Number(t.profit), 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.profit), 0))
  const decided = wins.length + losses.length
  const hitRate = decided > 0 ? (wins.length / decided) * 100 : null
  const profitFactor =
    grossLoss > 0 ? grossWin / grossLoss : wins.length > 0 ? Infinity : null
  const expectancy = decided > 0 ? pnl / decided : null

  const entryDates = list.map((t) => t.closeTime || t.openTime)
  const dayKeys = new Set(entryDates.map(localDayKey).filter(Boolean))
  const progress = rangeBounds
    ? buildDayCoverageProgress(entryDates, rangeBounds.start, rangeBounds.end)
    : {
        totalDays: dayKeys.size,
        coveredDays: dayKeys.size,
        progressPct: 0,
        isComplete: false,
      }

  const setupMap = new Map()
  for (const t of list) {
    const profit = Number(t.profit) || 0
    const isWin = profit > 0
    const isLoss = profit < 0
    const setups = t.setupIds || []
    if (!setups.length) {
      const cur =
        setupMap.get('—') || { key: '—', label: 'بدون ستاپ', count: 0, pnl: 0, tp: 0, sl: 0 }
      cur.count += 1
      cur.pnl += profit
      if (isWin) cur.tp += 1
      if (isLoss) cur.sl += 1
      setupMap.set('—', cur)
      continue
    }
    for (const s of setups) {
      const id = String(s._id || s)
      const label = s.title || 'ستاپ'
      const cur = setupMap.get(id) || { key: id, label, count: 0, pnl: 0, tp: 0, sl: 0 }
      cur.count += 1
      cur.pnl += profit
      if (isWin) cur.tp += 1
      if (isLoss) cur.sl += 1
      setupMap.set(id, cur)
    }
  }
  const setupRows = rankSetupRows([...setupMap.values()], 'trade').slice(0, 8)
  const topSetup = pickTopSetup(setupRows, 'trade')

  return {
    kind: 'trade',
    userId: String(user._id || user.id),
    publicName: user.publicName || 'کاربر',
    verified: !!user.verified,
    profileImage: user.profileImage || null,
    privacyWallPublic: !!user.privacySettings?.isPublic,
    count: list.length,
    tp: wins.length,
    sl: losses.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    unitNet: wins.length - losses.length,
    hitRate,
    profitFactor,
    expectancy,
    pnl,
    withRisk: true,
    buyCount: buy.length,
    sellCount: sell.length,
    buyTp: buyWins,
    buySl: buyLosses,
    sellTp: sellWins,
    sellSl: sellLosses,
    setupRows,
    topSetup,
    sessionRows: [],
    activeDays: dayKeys.size,
    totalDays: progress.totalDays,
    coveredDays: progress.coveredDays,
    progressPct: progress.progressPct,
    isComplete: progress.isComplete,
  }
}

/** Chart days (backtest) or trade days — what counts toward coverage. */
export function challengeDateBounds(challenge) {
  return {
    start: startOfLocalDay(challenge.backtestRangeStart),
    end: endOfLocalDay(challenge.backtestRangeEnd),
  }
}

/**
 * When the challenge is open to join/submit.
 * Trade: same as trade range. Backtest: separate challenge window.
 */
export function challengeWindowBounds(challenge) {
  const type = resolveChallengeType(challenge)
  if (type === 'trade') {
    return {
      start: startOfLocalDay(
        challenge.backtestRangeStart || challenge.challengeStartAt,
      ),
      end: endOfLocalDay(challenge.backtestRangeEnd || challenge.challengeEndAt),
    }
  }
  return {
    start: startOfLocalDay(
      challenge.challengeStartAt || challenge.backtestRangeStart,
    ),
    end: endOfLocalDay(challenge.challengeEndAt || challenge.backtestRangeEnd),
  }
}

export function getChallengePhase(challenge, now = new Date()) {
  if (challenge.status === 'cancelled') return 'cancelled'
  const { start, end } = challengeWindowBounds(challenge)
  if (challenge.status === 'ended' || now > end) return 'ended'
  if (now < start) return 'upcoming'
  return 'active'
}

/** Join is allowed only while the challenge is open and its deadline has not passed. */
export function challengeAcceptsJoins(challenge, now = new Date()) {
  if (!challenge) return false
  if (challenge.status === 'ended' || challenge.status === 'cancelled') {
    return false
  }
  const phase = getChallengePhase(challenge, now)
  if (phase === 'ended' || phase === 'cancelled') return false
  if (challenge.phase === 'ended' || challenge.phase === 'cancelled') return false
  const { end } = challengeWindowBounds(challenge)
  if (!end || Number.isNaN(end.getTime()) || now > end) return false
  return challenge.status === 'open' && ['upcoming', 'active'].includes(phase)
}

/** Challenge start/end (not historical chart range) cannot be before today. */
export function validateChallengeWindowNotPast(start, end, now = new Date()) {
  const today = startOfLocalDay(now)
  const s = startOfLocalDay(start)
  const e = startOfLocalDay(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return 'بازه چالش نامعتبر است'
  }
  if (s < today || e < today) {
    return 'تاریخ شروع و پایان چالش نمی‌تواند قبل از امروز باشد'
  }
  return null
}

/** Public = join without approval. Private = creator must approve. */
export function isPrivateChallenge(challenge) {
  return !!challenge?.requireApproval
}

/**
 * Rank setups from challenge-range backtests/trades.
 * Backtest: unit net (TP−SL), then hit rate. Trade: PnL, then hit rate.
 */
export function rankSetupRows(rows, kind = 'backtest') {
  const list = (rows || [])
    .map((r) => {
      const tp = Number(r.tp) || 0
      const sl = Number(r.sl) || 0
      const hits = tp + sl
      return {
        ...r,
        label: String(r.label || r.title || '').trim(),
        unitNet: r.unitNet != null ? Number(r.unitNet) : tp - sl,
        hitRate:
          r.hitRate != null ? Number(r.hitRate) : hits > 0 ? (tp / hits) * 100 : null,
        pnl: Number(r.pnl) || 0,
        count: Number(r.count) || 0,
        tp,
        sl,
      }
    })
    .filter((r) => {
      const label = r.label
      if (!label || label === '—' || label === 'بدون ستاپ') return false
      return (r.count || 0) > 0
    })

  list.sort((a, b) => {
    if (kind === 'trade') {
      if ((b.pnl || 0) !== (a.pnl || 0)) return (b.pnl || 0) - (a.pnl || 0)
    } else if ((b.unitNet || 0) !== (a.unitNet || 0)) {
      return (b.unitNet || 0) - (a.unitNet || 0)
    }
    const aHr = a.hitRate ?? -1
    const bHr = b.hitRate ?? -1
    if (bHr !== aHr) return bHr - aHr
    return (b.count || 0) - (a.count || 0)
  })
  return list
}

export function pickTopSetup(rows, kind = 'backtest') {
  return rankSetupRows(rows, kind)[0] || null
}

export function formatTopSetupLabel(row, kind = 'backtest') {
  if (!row?.label) return '—'
  if (kind === 'trade' && row.pnl != null) {
    const n = Number(row.pnl)
    const sign = n > 0 ? '+' : ''
    return `${row.label} (${sign}${n.toFixed(0)}$)`
  }
  if (row.hitRate != null) {
    return `${row.label} (${row.hitRate.toFixed(0)}%)`
  }
  if (row.unitNet != null && row.unitNet !== 0) {
    const sign = row.unitNet > 0 ? '+' : ''
    return `${row.label} (${sign}${row.unitNet})`
  }
  return row.label
}

export function canViewChallengeResults(challenge, { isCreator, isParticipant, isAdmin }) {
  if (isCreator || isAdmin) return true
  // Public challenges (no approval) — results are visible to everyone
  if (!challenge.requireApproval) return true
  if (challenge.resultsVisibility === 'public') return true
  return !!isParticipant
}

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('9')) return `0${digits}`
  if (digits.length === 11 && digits.startsWith('09')) return digits
  if (digits.length === 12 && digits.startsWith('98')) return `0${digits.slice(2)}`
  return digits
}
