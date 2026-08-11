export const FEEDBACK_CATEGORIES = [
  { value: 'add_symbol', label: 'افزودن نماد' },
  { value: 'add_setup', label: 'افزودن / مشکل ستاپ' },
  { value: 'upload_error', label: 'خطا در بارگذاری معاملات' },
  { value: 'account_activation', label: 'فعال‌سازی کاربری' },
  { value: 'login_issue', label: 'مشکل ورود / رمز عبور' },
  { value: 'bug_report', label: 'گزارش باگ / خطای سایت' },
  { value: 'feature_request', label: 'پیشنهاد قابلیت جدید' },
  { value: 'other', label: 'سایر' },
]

export const FEEDBACK_CATEGORY_VALUES = FEEDBACK_CATEGORIES.map((c) => c.value)

export function getFeedbackCategoryLabel(value) {
  return FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label || 'سایر'
}
