/** Pure period helpers — safe for client & server */

export const MONTH_NAMES = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
]

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Sunday-start week number (1-based) within year */
export function getWeekNumber(date) {
  const d = startOfDay(date)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d - yearStart) / 86400000) + 1
  const startDow = yearStart.getDay() // 0=Sun
  return Math.floor((dayOfYear + startDow - 1) / 7) + 1
}

export function getWeekRange(date = new Date()) {
  const d = startOfDay(date)
  const day = d.getDay() // 0 Sun
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: startOfDay(start), end: endOfDay(end) }
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start: startOfDay(start), end: endOfDay(end) }
}

export function getYearRange(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  const end = new Date(date.getFullYear(), 11, 31)
  return { start: startOfDay(start), end: endOfDay(end) }
}

export function buildPeriodInfo(periodType, date = new Date()) {
  if (periodType === 'week') {
    const { start, end } = getWeekRange(date)
    const year = start.getFullYear()
    const week = getWeekNumber(start)
    const month = start.getMonth() + 1
    return {
      periodType: 'week',
      periodKey: `${year}-W${String(week).padStart(2, '0')}`,
      periodLabel: `هفته ${week} سال ${year}`,
      year,
      month,
      week,
      startDate: start,
      endDate: end,
    }
  }
  if (periodType === 'month') {
    const { start, end } = getMonthRange(date)
    const year = start.getFullYear()
    const month = start.getMonth() + 1
    return {
      periodType: 'month',
      periodKey: `${year}-${String(month).padStart(2, '0')}`,
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      year,
      month,
      week: null,
      startDate: start,
      endDate: end,
    }
  }
  const { start, end } = getYearRange(date)
  const year = start.getFullYear()
  return {
    periodType: 'year',
    periodKey: `${year}`,
    periodLabel: `سال ${year}`,
    year,
    month: null,
    week: null,
    startDate: start,
    endDate: end,
  }
}

export function getPreviousPeriodDate(periodType, date = new Date()) {
  const d = new Date(date)
  if (periodType === 'week') {
    d.setDate(d.getDate() - 7)
    return d
  }
  if (periodType === 'month') {
    return new Date(d.getFullYear(), d.getMonth() - 1, 15)
  }
  return new Date(d.getFullYear() - 1, 6, 1)
}

/**
 * Weeks whose Sunday start falls inside the given calendar month.
 * weekOfMonth is 1-based index within that list.
 */
export function listWeeksInMonth(year, month) {
  const y = Number(year)
  const m = Number(month)
  if (!y || !m || m < 1 || m > 12) return []

  const monthStart = startOfDay(new Date(y, m - 1, 1))
  const monthEnd = endOfDay(new Date(y, m, 0))
  const weeks = []
  const cursor = new Date(monthStart)
  // Move to Sunday on or before the 1st
  cursor.setDate(cursor.getDate() - cursor.getDay())

  while (cursor <= monthEnd) {
    const { start, end } = getWeekRange(cursor)
    // Include week if it starts in this month (primary rule)
    if (start.getFullYear() === y && start.getMonth() + 1 === m) {
      const week = getWeekNumber(start)
      const weekOfMonth = weeks.length + 1
      weeks.push({
        weekOfMonth,
        week,
        year: start.getFullYear(),
        month: m,
        periodKey: `${start.getFullYear()}-W${String(week).padStart(2, '0')}`,
        periodLabel: `هفته ${weekOfMonth} ${MONTH_NAMES[m - 1]} ${y}`,
        startDate: start,
        endDate: end,
      })
    }
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

/** Year options for history pickers (past + current) */
export function getHistoryYearOptions(now = new Date(), span = 8) {
  const current = now.getFullYear()
  const years = []
  for (let y = current; y >= current - span; y -= 1) years.push(y)
  return years
}
