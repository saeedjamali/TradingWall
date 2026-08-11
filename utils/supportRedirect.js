/**
 * Build homepage support-section URL for inactive / blocked login flows.
 */
export function buildSupportRedirect({
  phone = '',
  category = 'account_activation',
  reason = 'inactive',
} = {}) {
  const params = new URLSearchParams()
  params.set('category', category)
  if (reason) params.set('reason', reason)
  if (phone) params.set('phone', phone)
  return `/?${params.toString()}#support`
}

export function isInactiveAccountError(message = '') {
  return String(message).includes('غیرفعال')
}
