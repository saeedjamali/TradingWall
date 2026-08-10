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
