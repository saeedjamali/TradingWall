/**
 * تبدیل تاریخ میلادی به شمسی برای نمایش
 * @param {Date} date - تاریخ میلادی
 * @returns {string} تاریخ شمسی به فارسی
 */
export function toJalali(date) {
  if (!date) return ''
  
  const d = new Date(date)
  
  // این یک تبدیل ساده است - برای دقت بیشتر از کتابخانه moment-jalaali استفاده کنید
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  
  // فرمول ساده تبدیل (تقریبی)
  const jYear = year - 621
  const jMonth = month
  const jDay = day
  
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  
  return `${jDay} ${persianMonths[jMonth - 1]} ${jYear}`
}

/**
 * فرمت کردن تاریخ به سبک انگلیسی
 * @param {Date} date 
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return ''
  
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/**
 * نمایش تاریخ با tooltip شمسی
 * @param {Date} date 
 * @returns {object} {text, tooltip}
 */
export function formatDateWithJalali(date) {
  return {
    text: formatDate(date),
    tooltip: toJalali(date)
  }
}

/**
 * نمایش تاریخ و ساعت میلادی و شمسی
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  const gregorian = d.toLocaleString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const jalali = d.toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return `${gregorian}\n(${jalali})`
}

/** Local calendar month: day 1 00:00:00.000 → last day 23:59:59.999 */
export function monthLocalBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Query bound from YYYY-MM-DD (local calendar day) or a full ISO timestamp.
 * Full ISO is used as-is so the client's timezone is preserved.
 */
export function parseQueryDayBound(value, { end = false } = {}) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (dayOnly) {
    const d = new Date(
      Number(dayOnly[1]),
      Number(dayOnly[2]) - 1,
      Number(dayOnly[3]),
    )
    if (end) d.setHours(23, 59, 59, 999)
    else d.setHours(0, 0, 0, 0)
    return d
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d
}
