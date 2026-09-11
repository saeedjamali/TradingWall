import { NextResponse } from 'next/server'
import { getPublicPosts } from '@/lib/blogQueries'
import { PRODUCTION_SITE_URL, SITE_NAME_FA } from '@/utils/site'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { posts } = await getPublicPosts({ limit: 30 })
  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${PRODUCTION_SITE_URL}/blog/${post.slug}</link>
      <guid>${PRODUCTION_SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
    </item>`,
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME_FA} — بلاگ</title>
    <link>${PRODUCTION_SITE_URL}/blog</link>
    <description>مقالات ژورنال معاملاتی، بک‌تست فارکس و آموزش معامله</description>
    <language>fa-IR</language>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
