import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogRating from '@/models/BlogRating'
import User from '@/models/User'
import { isPublicPost, ratingAverage } from '@/utils/blog'

export async function POST(request, { params }) {
  try {
    await connectDB()
    const { slug } = await params
    const body = await request.json()
    const userId = body.userId
    const value = Number(body.value)

    if (!userId) {
      return NextResponse.json({ error: 'برای امتیاز دادن وارد شوید' }, { status: 401 })
    }
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: 'امتیاز باید بین ۱ تا ۵ باشد' }, { status: 400 })
    }

    const user = await User.findById(userId).select('_id isActive')
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: 'حساب کاربری معتبر نیست' }, { status: 403 })
    }

    const post = await BlogPost.findOne({ slug })
    if (!isPublicPost(post)) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    const existing = await BlogRating.findOne({ postId: post._id, userId })
    if (existing) {
      post.ratingSum = post.ratingSum - existing.value + value
      existing.value = value
      await existing.save()
    } else {
      await BlogRating.create({ postId: post._id, userId, value })
      post.ratingSum += value
      post.ratingCount += 1
    }
    await post.save()

    return NextResponse.json({
      success: true,
      ratingAvg: ratingAverage(post.ratingSum, post.ratingCount),
      ratingCount: post.ratingCount,
    })
  } catch (error) {
    console.error('Blog rate error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
