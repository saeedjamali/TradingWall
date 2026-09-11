/**
 * Fuzzy match of broker/MT symbol codes against the official list.
 * Handles suffixes like _i, .i, #, and minor spelling drift.
 */

function stripNoise(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[_./-]?I$/i, '')
    .replace(/[#.]+$/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

function levenshtein(a, b) {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const row = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i += 1) {
    let prev = i - 1
    row[0] = i
    for (let j = 1; j <= n; j += 1) {
      const tmp = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return row[n]
}

export function normalizeSymbolCode(code) {
  return String(code || '').trim().toUpperCase()
}

/**
 * @param {string} unknownCode
 * @param {Array<{ code: string, name?: string, nameFa?: string, category?: string }>} official
 * @param {number} [limit]
 */
export function findSimilarSymbols(unknownCode, official, limit = 3) {
  const needle = stripNoise(unknownCode)
  if (!needle || !Array.isArray(official) || official.length === 0) return []

  const scored = official
    .map((item) => {
      const hay = stripNoise(item.code)
      if (!hay) return null
      let score = 0
      if (hay === needle) score = 100
      else if (hay.startsWith(needle) || needle.startsWith(hay)) score = 82
      else if (hay.includes(needle) || needle.includes(hay)) score = 64
      else {
        const dist = levenshtein(needle, hay)
        const maxLen = Math.max(needle.length, hay.length)
        if (maxLen >= 4 && dist <= 2) score = 55 - dist
        else if (maxLen && dist / maxLen <= 0.22) score = 48
      }
      if (score < 40) return null
      return {
        code: item.code,
        name: item.name || '',
        nameFa: item.nameFa || '',
        category: item.category || 'other',
        score,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  const seen = new Set()
  const unique = []
  for (const item of scored) {
    if (seen.has(item.code)) continue
    seen.add(item.code)
    unique.push(item)
    if (unique.length >= limit) break
  }
  return unique
}
