import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogComment from '@/models/BlogComment'
import BlogRating from '@/models/BlogRating'
import { requireAdmin } from '@/utils/adminAuth'
import { slugify, splitCsv, clampPinPriority } from '@/utils/blog'
import { getActiveBlogCategories } from '@/utils/siteSettings'

function serializeFaqs(faqs) {
  if (!Array.isArray(faqs)) return []
  return faqs
    .map((item) => ({
      q: String(item?.q || '').trim(),
      a: String(item?.a || '').trim(),
    }))
    .filter((item) => item.q && item.a)
    .slice(0, 8)
}

function serializeHowTo(steps) {
  if (!Array.isArray(steps)) return []
  return steps
    .map((item) => ({
      name: String(item?.name || item?.q || '').trim(),
      text: String(item?.text || item?.a || '').trim(),
    }))
    .filter((item) => item.name && item.text)
    .slice(0, 12)
}

function buildPayload(body, author, activeCategories) {
  const title = String(body.title || '').trim()
  const slug = slugify(body.slug || title)
  const allowed = new Set(activeCategories.map((item) => item.slug))
  const requested = Array.isArray(body.categories)
    ? body.categories
    : [body.category]
  const categories = [
    ...new Set(
      requested
        .map((item) => String(item || '').trim().toLowerCase())
        .filter((item) => allowed.has(item)),
    ),
  ]
  if (!categories.length) {
    categories.push(allowed.has('education') ? 'education' : activeCategories[0]?.slug)
  }
  const payload = {
    title,
    slug,
    excerpt: String(body.excerpt || '').trim(),
    body: String(body.body || '').trim(),
    coverImage: body.coverImage || null,
    coverImageAlt: String(body.coverImageAlt || '').trim(),
    videoUrl: String(body.videoUrl || '').trim(),
    videoFile: body.videoFile || null,
    gallery: Array.isArray(body.gallery) ? body.gallery.filter(Boolean).slice(0, 8) : [],
    category: categories[0],
    categories,
    tags: Array.isArray(body.tags) ? body.tags : splitCsv(body.tags),
    keywords: Array.isArray(body.keywords) ? body.keywords : splitCsv(body.keywords),
    focusKeyword: String(body.focusKeyword || '').trim(),
    seoTitle: String(body.seoTitle || '').trim(),
    seoDescription: String(body.seoDescription || '').trim(),
    faqs: serializeFaqs(body.faqs),
    howToSteps: serializeHowTo(body.howToSteps),
    isActive: body.isActive !== false,
    isVisible: body.isVisible !== false,
    isPinned: body.isPinned === true,
    pinPriority: clampPinPriority(body.pinPriority, body.isPinned === true),
    commentsEnabled: body.commentsEnabled !== false,
    commentsRequireApproval: body.commentsRequireApproval !== false,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    authorId: author?._id || null,
    authorName: author?.publicName || 'دیوار معاملاتی',
  }
  if (body.isDemo !== undefined) payload.isDemo = body.isDemo === true
  return payload
}

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const admin = await requireAdmin(searchParams.get('adminUserId'))
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })

    const q = (searchParams.get('q') || '').trim()
    const filter = {}
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ]
    }

    const [posts, categories] = await Promise.all([
      BlogPost.find(filter)
      .sort({ isPinned: -1, pinPriority: -1, updatedAt: -1 })
      .limit(200)
      .lean(),
      getActiveBlogCategories(),
    ])
    return NextResponse.json({ success: true, posts, categories })
  } catch (error) {
    console.error('Admin blog GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })

    const categories = await getActiveBlogCategories()
    const payload = buildPayload(body, admin, categories)
    if (!payload.title || !payload.body || !payload.slug) {
      return NextResponse.json({ error: 'عنوان، متن و نامک الزامی است' }, { status: 400 })
    }

    const exists = await BlogPost.findOne({ slug: payload.slug })
    if (exists) {
      return NextResponse.json({ error: 'این نامک قبلاً استفاده شده است' }, { status: 400 })
    }

    const post = await BlogPost.create(payload)
    return NextResponse.json({ success: true, post, message: 'مقاله ذخیره شد' })
  } catch (error) {
    console.error('Admin blog POST error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    if (!body.postId) {
      return NextResponse.json({ error: 'شناسه مقاله الزامی است' }, { status: 400 })
    }

    const post = await BlogPost.findById(body.postId)
    if (!post) return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })

    const categories = await getActiveBlogCategories()
    const payload = buildPayload(body, admin, categories)
    if (payload.slug !== post.slug) {
      const clash = await BlogPost.findOne({ slug: payload.slug, _id: { $ne: post._id } })
      if (clash) {
        return NextResponse.json({ error: 'این نامک قبلاً استفاده شده است' }, { status: 400 })
      }
    }

    Object.assign(post, payload)
    await post.save()
    return NextResponse.json({ success: true, post, message: 'مقاله به‌روزرسانی شد' })
  } catch (error) {
    console.error('Admin blog PUT error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    if (!body.postId) {
      return NextResponse.json({ error: 'شناسه مقاله الزامی است' }, { status: 400 })
    }

    const deleted = await BlogPost.findByIdAndDelete(body.postId)
    if (!deleted) return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })

    await Promise.all([
      BlogComment.deleteMany({ postId: deleted._id }),
      BlogRating.deleteMany({ postId: deleted._id }),
    ])

    return NextResponse.json({ success: true, message: 'مقاله حذف شد' })
  } catch (error) {
    console.error('Admin blog DELETE error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
