import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { resolveUploadPath } from '@/utils/uploads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

/**
 * Serve files from root /uploads (not public/) so uploads work after `next build`.
 * URL stays: /uploads/profiles/..., /uploads/plans/..., /uploads/messages/...
 */
export async function GET(_request, { params }) {
  try {
    const segments = (await params).path
    if (!Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'مسیر نامعتبر است' }, { status: 400 })
    }

    const relativePath = segments.join('/')
    const absolute = resolveUploadPath(relativePath)
    if (!absolute || !existsSync(absolute)) {
      return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 404 })
    }

    const info = await stat(absolute)
    if (!info.isFile()) {
      return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 404 })
    }

    const buffer = await readFile(absolute)
    const ext = path.extname(absolute).toLowerCase()
    const contentType = MIME[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(info.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Serve upload error:', error)
    return NextResponse.json({ error: 'خطا در دریافت فایل' }, { status: 500 })
  }
}
