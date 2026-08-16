/**
 * Forex market sessions, DST rules, holidays, and timezone helpers
 *
 * Session local open hours (typical retail FX):
 * - Sydney:  07:00–16:00 local
 * - Tokyo:   09:00–18:00 JST (no DST)
 * - London:  08:00–17:00 GMT/BST
 * - New York: 08:00–17:00 EST/EDT
 */

export const TIMEZONES = [
  { id: 'utc', label: 'GMT / UTC', offsetStd: 0, dstRegion: null },
  { id: 'tehran', label: 'تهران (IRST)', offsetStd: 3.5, dstRegion: null },
  { id: 'tokyo', label: 'توکیو (JST)', offsetStd: 9, dstRegion: null },
  { id: 'sydney', label: 'استرالیا (سیدنی)', offsetStd: 10, dstRegion: 'au' },
  { id: 'london', label: 'لندن', offsetStd: 0, dstRegion: 'uk' },
  { id: 'newyork', label: 'نیویورک', offsetStd: -5, dstRegion: 'us' },
]

/** New York bank / Fedwire typical hours (local Eastern Time) */
export const NY_BANK_HOURS = {
  id: 'ny-bank',
  name: 'بانک نیویورک',
  nameEn: 'NY Bank / Fedwire',
  color: '#a78bfa',
  localOpen: 9,
  localClose: 17,
  homeZone: 'newyork',
  note: 'ساعات معمول بانک و Fedwire در وقت شرقی آمریکا (۹ صبح تا ۵ عصر)',
}

export const SESSIONS = [
  {
    id: 'sydney',
    name: 'سیدنی',
    nameEn: 'Sydney',
    color: '#06b6d4',
    localOpen: 7,
    localClose: 16,
    homeZone: 'sydney',
  },
  {
    id: 'tokyo',
    name: 'توکیو',
    nameEn: 'Tokyo',
    color: '#f59e0b',
    localOpen: 9,
    localClose: 18,
    homeZone: 'tokyo',
  },
  {
    id: 'london',
    name: 'لندن',
    nameEn: 'London',
    color: '#3b82f6',
    localOpen: 8,
    localClose: 17,
    homeZone: 'london',
  },
  {
    id: 'newyork',
    name: 'نیویورک',
    nameEn: 'New York',
    color: '#8b5cf6',
    localOpen: 8,
    localClose: 17,
    homeZone: 'newyork',
  },
]

function nthWeekdayOfMonth(year, month, weekday, n) {
  const d = new Date(Date.UTC(year, month, 1))
  let count = 0
  while (d.getUTCMonth() === month) {
    if (d.getUTCDay() === weekday) {
      count += 1
      if (count === n) return new Date(d)
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return null
}

function lastWeekdayOfMonth(year, month, weekday) {
  const d = new Date(Date.UTC(year, month + 1, 0))
  while (d.getUTCDay() !== weekday) {
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return d
}

/** US DST: 2nd Sunday Mar → 1st Sunday Nov (UTC approx for date compare) */
export function isUsDst(date) {
  const y = date.getUTCFullYear()
  const start = nthWeekdayOfMonth(y, 2, 0, 2)
  const end = nthWeekdayOfMonth(y, 10, 0, 1)
  const t = Date.UTC(y, date.getUTCMonth(), date.getUTCDate())
  return t >= start.getTime() && t < end.getTime()
}

/** UK/EU DST: last Sunday Mar → last Sunday Oct */
export function isUkDst(date) {
  const y = date.getUTCFullYear()
  const start = lastWeekdayOfMonth(y, 2, 0)
  const end = lastWeekdayOfMonth(y, 9, 0)
  const t = Date.UTC(y, date.getUTCMonth(), date.getUTCDate())
  return t >= start.getTime() && t < end.getTime()
}

/** Australia AEDT: 1st Sunday Oct → 1st Sunday Apr */
export function isAuDst(date) {
  const y = date.getUTCFullYear()
  const start = nthWeekdayOfMonth(y, 9, 0, 1)
  const endThis = nthWeekdayOfMonth(y, 3, 0, 1)
  const t = Date.UTC(y, date.getUTCMonth(), date.getUTCDate())

  if (date.getUTCMonth() >= 9) {
    return t >= start.getTime()
  }
  if (date.getUTCMonth() < 3) {
    const prevStart = nthWeekdayOfMonth(y - 1, 9, 0, 1)
    return t >= prevStart.getTime() && t < endThis.getTime()
  }
  return false
}

export function getZoneOffsetHours(zoneId, date = new Date()) {
  const zone = TIMEZONES.find((z) => z.id === zoneId)
  if (!zone) return 0
  let offset = zone.offsetStd
  if (zone.dstRegion === 'us' && isUsDst(date)) offset += 1
  if (zone.dstRegion === 'uk' && isUkDst(date)) offset += 1
  if (zone.dstRegion === 'au' && isAuDst(date)) offset += 1
  return offset
}

export function getDstInfo(zoneId, date = new Date()) {
  const zone = TIMEZONES.find((z) => z.id === zoneId)
  if (!zone || !zone.dstRegion) {
    return { active: false, label: 'بدون DST', delta: 0 }
  }
  let active = false
  if (zone.dstRegion === 'us') active = isUsDst(date)
  if (zone.dstRegion === 'uk') active = isUkDst(date)
  if (zone.dstRegion === 'au') active = isAuDst(date)
  return {
    active,
    label: active ? 'تابستانه (+1)' : 'زمستانه',
    delta: active ? 1 : 0,
  }
}

/** Local wall-clock hour in zone → UTC hour (0–24, may be fractional conceptually) */
export function localHourToUtc(localHour, zoneId, date = new Date()) {
  const offset = getZoneOffsetHours(zoneId, date)
  let utc = localHour - offset
  while (utc < 0) utc += 24
  while (utc >= 24) utc -= 24
  return utc
}

export function utcHourToLocal(utcHour, zoneId, date = new Date()) {
  const offset = getZoneOffsetHours(zoneId, date)
  let local = utcHour + offset
  while (local < 0) local += 24
  while (local >= 24) local -= 24
  return local
}

export function formatHour(h) {
  const wrapped = ((h % 24) + 24) % 24
  const totalMins = Math.round(wrapped * 60)
  const hh = Math.floor(totalMins / 60) % 24
  const mm = totalMins % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function formatUtcOffset(offsetHours) {
  const sign = offsetHours >= 0 ? '+' : '-'
  const abs = Math.abs(offsetHours)
  const hours = Math.floor(abs)
  const mins = Math.round((abs - hours) * 60)
  if (mins === 0) return `UTC${sign}${hours}`
  return `UTC${sign}${hours}:${String(mins).padStart(2, '0')}`
}

export function getSessionUtcRange(session, date = new Date()) {
  const openUtc = localHourToUtc(session.localOpen, session.homeZone, date)
  const closeUtc = localHourToUtc(session.localClose, session.homeZone, date)
  return { openUtc, closeUtc }
}

export function getSessionInZone(session, displayZoneId, date = new Date()) {
  const { openUtc, closeUtc } = getSessionUtcRange(session, date)
  return {
    open: utcHourToLocal(openUtc, displayZoneId, date),
    close: utcHourToLocal(closeUtc, displayZoneId, date),
    openUtc,
    closeUtc,
  }
}

/** Position 0–100 on 24h timeline for a UTC hour */
export function hourToPercent(hour) {
  return (hour / 24) * 100
}

/**
 * Segments for a session on a 24h UTC bar (handles wrap overnight)
 * returns [{ startPct, endPct }]
 */
export function sessionSegmentsUtc(openUtc, closeUtc) {
  if (openUtc < closeUtc) {
    return [
      {
        startPct: hourToPercent(openUtc),
        endPct: hourToPercent(closeUtc),
      },
    ]
  }
  // wraps midnight
  return [
    { startPct: hourToPercent(openUtc), endPct: 100 },
    { startPct: 0, endPct: hourToPercent(closeUtc) },
  ]
}

/** Expand session into non-wrapping UTC intervals [start, end) within 0–24 */
export function sessionUtcIntervals(openUtc, closeUtc) {
  if (openUtc === closeUtc) return []
  if (openUtc < closeUtc) return [[openUtc, closeUtc]]
  return [
    [openUtc, 24],
    [0, closeUtc],
  ]
}

export function intersectUtcIntervals(a, b) {
  const out = []
  for (const [a0, a1] of a) {
    for (const [b0, b1] of b) {
      const start = Math.max(a0, b0)
      const end = Math.min(a1, b1)
      if (end > start + 1e-9) out.push([start, end])
    }
  }
  return out
}

export function intervalsToSegments(intervals) {
  return intervals.map(([open, close]) => ({
    startPct: hourToPercent(open),
    endPct: hourToPercent(close),
  }))
}

export function durationHours(intervals) {
  return intervals.reduce((sum, [a, b]) => sum + (b - a), 0)
}

export function isUtcInIntervals(hour, intervals) {
  return intervals.some(([a, b]) => hour >= a && hour < b)
}

/**
 * All pairwise session overlaps for the given date (DST-aware via getSessionUtcRange)
 */
export function getAllSessionOverlaps(date = new Date()) {
  const pairs = []
  for (let i = 0; i < SESSIONS.length; i++) {
    for (let j = i + 1; j < SESSIONS.length; j++) {
      const a = SESSIONS[i]
      const b = SESSIONS[j]
      const ra = getSessionUtcRange(a, date)
      const rb = getSessionUtcRange(b, date)
      const intervals = intersectUtcIntervals(
        sessionUtcIntervals(ra.openUtc, ra.closeUtc),
        sessionUtcIntervals(rb.openUtc, rb.closeUtc),
      )
      if (!intervals.length) continue
      pairs.push({
        id: `${a.id}-${b.id}`,
        sessionA: a,
        sessionB: b,
        label: `${a.name} × ${b.name}`,
        labelEn: `${a.nameEn} × ${b.nameEn}`,
        intervals,
        hours: durationHours(intervals),
        colorA: a.color,
        colorB: b.color,
      })
    }
  }
  return pairs.sort((x, y) => y.hours - x.hours)
}

export function isSessionOpenNow(session, date = new Date()) {
  const { openUtc, closeUtc } = getSessionUtcRange(session, date)
  const now =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  if (openUtc < closeUtc) return now >= openUtc && now < closeUtc
  return now >= openUtc || now < closeUtc
}

// ——— Holidays (month is 1–12) ———
// Recurring fixed dates; floating ones computed per year

const FIXED_FOREX_HOLIDAYS = [
  { month: 1, day: 1, name: 'سال نو میلادی', markets: ['all'] },
  { month: 12, day: 25, name: 'کریسمس', markets: ['all'] },
]

const FIXED_US_BANK_HOLIDAYS = [
  { month: 1, day: 1, name: 'New Year’s Day' },
  { month: 6, day: 19, name: 'Juneteenth' },
  { month: 7, day: 4, name: 'Independence Day' },
  { month: 11, day: 11, name: 'Veterans Day' },
  { month: 12, day: 25, name: 'Christmas Day' },
]

function observedIfWeekend(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day))
  const wd = d.getUTCDay()
  if (wd === 0) d.setUTCDate(d.getUTCDate() + 1) // Sunday → Monday
  if (wd === 6) d.setUTCDate(d.getUTCDate() - 1) // Saturday → Friday
  return d
}

function getUsFloatingBankHolidays(year) {
  return [
    {
      date: nthWeekdayOfMonth(year, 0, 1, 3), // MLK — 3rd Monday Jan
      name: 'Martin Luther King Jr. Day',
    },
    {
      date: nthWeekdayOfMonth(year, 1, 1, 3), // Presidents — 3rd Monday Feb
      name: 'Presidents’ Day',
    },
    {
      date: lastWeekdayOfMonth(year, 4, 1), // Memorial — last Monday May
      name: 'Memorial Day',
    },
    {
      date: nthWeekdayOfMonth(year, 8, 1, 1), // Labor — 1st Monday Sep
      name: 'Labor Day',
    },
    {
      date: nthWeekdayOfMonth(year, 9, 1, 2), // Columbus — 2nd Monday Oct
      name: 'Columbus Day',
    },
    {
      date: nthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving — 4th Thursday Nov
      name: 'Thanksgiving Day',
    },
  ].filter((x) => x.date)
}

/** Good Friday — approximate via known Easter algorithm */
function easterSundayUtc(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month, day))
}

function goodFriday(year) {
  const easter = easterSundayUtc(year)
  easter.setUTCDate(easter.getUTCDate() - 2)
  return easter
}

export function getForexHolidays(year) {
  const list = FIXED_FOREX_HOLIDAYS.map((h) => ({
    date: observedIfWeekend(year, h.month, h.day),
    name: h.name,
    type: 'forex',
    note: 'بازار فارکس معمولاً بسته یا نقدینگی بسیار پایین',
  }))

  list.push({
    date: goodFriday(year),
    name: 'جمعه نیک (Good Friday)',
    type: 'forex',
    note: 'بسیاری از مراکز معاملاتی بسته',
  })

  return list.sort((a, b) => a.date - b.date)
}

export function getNyBankHolidays(year) {
  const fixed = FIXED_US_BANK_HOLIDAYS.map((h) => ({
    date: observedIfWeekend(year, h.month, h.day),
    name: h.name,
    type: 'bank',
    note: 'تعطیلی بانک‌های آمریکا / فدرال رزرو',
  }))

  const floating = getUsFloatingBankHolidays(year).map((h) => ({
    date: h.date,
    name: h.name,
    type: 'bank',
    note: 'تعطیلی بانک‌های آمریکا / فدرال رزرو',
  }))

  return [...fixed, ...floating].sort((a, b) => a.date - b.date)
}

export function formatFaDate(date) {
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'UTC',
  })
}

export function sameUtcDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

function startOfUtcDay(d) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function endOfUtcWeek(d) {
  const day = d.getUTCDay()
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  end.setUTCDate(end.getUTCDate() + (6 - day))
  end.setUTCHours(23, 59, 59, 999)
  return end.getTime()
}

function endOfUtcMonth(d) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Holiday alerts for today / remaining week / remaining month
 */
export function getHolidayAlerts(date = new Date()) {
  const year = date.getUTCFullYear()
  const all = [
    ...getForexHolidays(year).map((h) => ({ ...h, kind: 'فارکس' })),
    ...getNyBankHolidays(year).map((h) => ({ ...h, kind: 'بانک NY' })),
  ]
  // include next year edge near Dec
  if (date.getUTCMonth() === 11) {
    all.push(
      ...getForexHolidays(year + 1).map((h) => ({ ...h, kind: 'فارکس' })),
      ...getNyBankHolidays(year + 1).map((h) => ({ ...h, kind: 'بانک NY' })),
    )
  }

  const todayStart = startOfUtcDay(date)
  const weekEnd = endOfUtcWeek(date)
  const monthEnd = endOfUtcMonth(date)

  const inRange = (h, end) => {
    const t = startOfUtcDay(h.date)
    return t >= todayStart && t <= end
  }

  const today = all.filter((h) => sameUtcDay(h.date, date))
  const week = all
    .filter((h) => inRange(h, weekEnd))
    .sort((a, b) => a.date - b.date)
  const month = all
    .filter((h) => inRange(h, monthEnd))
    .sort((a, b) => a.date - b.date)

  return { today, week, month }
}

export function isNyBankOpenNow(date = new Date()) {
  if (getNyBankHolidays(date.getUTCFullYear()).some((h) => sameUtcDay(h.date, date))) {
    return false
  }
  const wd = date.getUTCDay()
  // Convert to NY local weekday roughly via offset
  const offset = getZoneOffsetHours('newyork', date)
  let localHour =
    date.getUTCHours() + date.getUTCMinutes() / 60 + offset
  let localDay = wd
  if (localHour >= 24) {
    localHour -= 24
    localDay = (localDay + 1) % 7
  }
  if (localHour < 0) {
    localHour += 24
    localDay = (localDay + 6) % 7
  }
  if (localDay === 0 || localDay === 6) return false
  return localHour >= NY_BANK_HOURS.localOpen && localHour < NY_BANK_HOURS.localClose
}
