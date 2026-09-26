import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPublicPostBySlug } from '@/lib/blogQueries'

export const alt = 'دیوار معاملاتی'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

export default async function Image({ params }) {
  const { slug } = await params
  const data = await getPublicPostBySlug(slug)
  const cover = data?.post?.coverImage

  if (cover && cover.startsWith('/')) {
    try {
      const filePath = join(process.cwd(), 'public', cover.replace(/^\//, ''))
      const bytes = await readFile(filePath)
      return new Response(bytes, {
        headers: {
          'Content-Type': cover.endsWith('.jpg') || cover.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      })
    } catch {
      // fall through to default card
    }
  }

  const { default: DefaultOg } = await import('@/app/opengraph-image')
  return DefaultOg()
}
