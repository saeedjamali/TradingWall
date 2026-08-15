import path from 'path'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'

/** Root-level uploads dir (outside public — survives Next build) */
export function getUploadsRoot() {
  return path.join(process.cwd(), 'uploads')
}

export function getUploadSubDir(type = 'profile') {
  if (type === 'message') return 'messages'
  if (type === 'plan') return 'plans'
  if (type === 'trade') return 'trades'
  if (type === 'backtest') return 'backtests'
  return 'profiles'
}

export async function ensureUploadDir(type = 'profile') {
  const subDir = getUploadSubDir(type)
  const dir = path.join(getUploadsRoot(), subDir)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  return { dir, subDir }
}

/**
 * Resolve a safe absolute path under uploads/, or null if path escapes.
 * relativePath e.g. "profiles/foo.jpg"
 */
export function resolveUploadPath(relativePath) {
  if (!relativePath) return null
  const normalized = path
    .normalize(relativePath)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^[/\\]+/, '')

  if (!normalized || normalized.includes('..')) return null

  const root = getUploadsRoot()
  const absolute = path.join(root, normalized)
  if (!absolute.startsWith(root)) return null
  return absolute
}

export function publicUploadUrl(subDir, filename) {
  return `/uploads/${subDir}/${filename}`
}
