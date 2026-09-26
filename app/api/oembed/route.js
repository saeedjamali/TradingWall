import { NextResponse } from 'next/server'
import { getPublicPostBySlug } from '@/lib/blogQueries'
import { SITE_NAME_FA, PRODUCTION_SITE_URL, isLocalOrigin } from '@/utils/site'
import { shareImage } from '@/utils/shareMeta'

function allowedUrl(raw) {
  try {
    const parsed = new URL(String(raw || ''))
    const origin = `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '')
    if (origin === PRODUCTION_SITE_URL) return parsed
    if (isLocalOrigin(origin) && process.env.NODE_ENV !== 'production') return parsed
    return null
  } catch {
    return null
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('url')
  const parsed = allowedUrl(raw)
  if (!parsed) {
    return NextResponse.json({ error: 'url نامعتبر است' }, { status: 400 })
  }

  const blogMatch = parsed.pathname.match(/^\/blog\/([^/]+)\/?$/)
  if (blogMatch) {
    const data = await getPublicPostBySlug(decodeURIComponent(blogMatch[1]))
    if (!data?.post) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 })
    }
    const post = data.post
    const image = shareImage(post.coverImage, post.coverImageAlt || post.title)
    return NextResponse.json({
      version: '1.0',
      type: 'link',
      provider_name: SITE_NAME_FA,
      provider_url: PRODUCTION_SITE_URL,
      title: post.seoTitle || post.title,
      author_name: post.authorName || SITE_NAME_FA,
      thumbnail_url: image.url,
      thumbnail_width: image.width,
      thumbnail_height: image.height,
      url: `${PRODUCTION_SITE_URL}/blog/${post.slug}`,
    })
  }

  return NextResponse.json({
    version: '1.0',
    type: 'link',
    provider_name: SITE_NAME_FA,
    provider_url: PRODUCTION_SITE_URL,
    title: SITE_NAME_FA,
    thumbnail_url: shareImage().url,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    url: `${PRODUCTION_SITE_URL}${parsed.pathname}`,
  })
}
