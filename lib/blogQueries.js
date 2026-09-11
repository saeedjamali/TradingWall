import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogComment from '@/models/BlogComment'
import { isPublicPost, publicPostFilter, PUBLIC_POST_SORT, ratingAverage, readingMinutes } from '@/utils/blog'

export async function getPinnedPosts({ category, tag, q, limit = 3 } = {}) {
  await connectDB()
  const filter = { ...publicPostFilter(), isPinned: true }
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ]
  }

  const items = await BlogPost.find(filter)
    .select('title slug excerpt coverImage coverImageAlt category tags publishedAt views ratingSum ratingCount authorName isPinned pinPriority')
    .sort({ pinPriority: -1, publishedAt: -1 })
    .limit(limit)
    .lean()

  return items.map((post) => ({
    ...post,
    ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
    readingMinutes: readingMinutes(post.excerpt),
  }))
}

export async function getPublicPosts({ category, tag, q, page = 1, limit = 12, excludeIds = [] } = {}) {
  await connectDB()
  const filter = publicPostFilter()
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit
  if (excludeIds.length) {
    filter._id = { $nin: excludeIds }
  }
  const [items, total] = await Promise.all([
    BlogPost.find(filter)
      .select('title slug excerpt coverImage coverImageAlt category tags publishedAt views ratingSum ratingCount authorName isPinned pinPriority')
      .sort(PUBLIC_POST_SORT)
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ])

  return {
    posts: items.map((post) => ({
      ...post,
      ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
      readingMinutes: readingMinutes(post.excerpt),
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  }
}

export async function getPublicPostBySlug(slug, { countView = false } = {}) {
  await connectDB()
  const post = await BlogPost.findOne({ slug }).lean()
  if (!isPublicPost(post)) return null

  if (countView) {
    await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } })
  }

  const related = await BlogPost.find({
    ...publicPostFilter(),
    _id: { $ne: post._id },
    $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }],
  })
      .select('title slug excerpt coverImage category publishedAt isPinned')
      .sort(PUBLIC_POST_SORT)
    .limit(3)
    .lean()

  const comments = post.commentsEnabled
    ? await BlogComment.find({ postId: post._id, isApproved: true })
        .populate('userId', 'publicName verified')
        .sort({ createdAt: -1 })
        .limit(80)
        .lean()
    : []

  return {
    post: {
      ...post,
      views: (post.views || 0) + (countView ? 1 : 0),
      ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
      readingMinutes: readingMinutes(post.body),
    },
    related,
    comments,
  }
}
