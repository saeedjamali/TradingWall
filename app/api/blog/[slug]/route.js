import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogComment from '@/models/BlogComment'
import { isPublicPost, publicPostFilter, PUBLIC_POST_SORT, ratingAverage, readingMinutes } from '@/utils/blog'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  try {
    await connectDB()
    const { slug } = await params
    const post = await BlogPost.findOne({ slug }).lean()
    if (!isPublicPost(post)) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } })

    const related = await BlogPost.find({
      ...publicPostFilter(),
      _id: { $ne: post._id },
      $or: [
        { category: post.category },
        { tags: { $in: post.tags || [] } },
      ],
    })
      .select('title slug excerpt coverImage category publishedAt')
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

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        views: (post.views || 0) + 1,
        ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
        readingMinutes: readingMinutes(post.body),
      },
      related,
      comments,
    })
  } catch (error) {
    console.error('Blog post error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
