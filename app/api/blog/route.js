import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import { publicPostFilter, ratingAverage } from '@/utils/blog'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const tag = searchParams.get('tag') || ''
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(24, Math.max(6, parseInt(searchParams.get('limit') || '12', 10)))

    const filter = publicPostFilter()
    if (category) filter.category = category
    if (tag) filter.tags = tag
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } },
      ]
    }

    const [items, total] = await Promise.all([
      BlogPost.find(filter)
        .select(
          'title slug excerpt coverImage coverImageAlt category tags publishedAt updatedAt views ratingSum ratingCount readingHint authorName',
        )
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(filter),
    ])

    const posts = items.map((post) => ({
      ...post,
      ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
    }))

    return NextResponse.json({
      success: true,
      posts,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error('Blog list error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
