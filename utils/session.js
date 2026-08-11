/**
 * Normalize session user from localStorage.
 * Older profile saves stored mongoose docs with `_id` instead of `id`.
 * Returns a clean session object or null if unusable.
 */
export function normalizeSessionUser(raw) {
  if (!raw) return null

  let user = raw
  if (typeof raw === 'string') {
    try {
      user = JSON.parse(raw)
    } catch {
      return null
    }
  }

  let id = user.id
  if (!id && user._id) {
    id = typeof user._id === 'object'
      ? (user._id.toString?.() || String(user._id))
      : String(user._id)
  }

  if (!id || id === 'undefined' || id === 'null') {
    return null
  }

  return {
    id: String(id),
    phone: user.phone || '',
    publicName: user.publicName || 'کاربر',
    role: user.role || 'user',
    verified: !!user.verified,
  }
}

/**
 * Read + repair localStorage user session.
 * If repaired, writes back to localStorage.
 */
export function getSessionUser() {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem('user')
  const tokenExpiry = localStorage.getItem('tokenExpiry')

  if (!raw || !tokenExpiry) return null
  if (Date.now() >= parseInt(tokenExpiry)) {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    return null
  }

  const normalized = normalizeSessionUser(raw)
  if (!normalized) {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    return null
  }

  // Persist repaired shape if needed
  try {
    const current = JSON.parse(raw)
    if (!current.id || current._id) {
      localStorage.setItem('user', JSON.stringify(normalized))
    }
  } catch {
    localStorage.setItem('user', JSON.stringify(normalized))
  }

  return normalized
}
