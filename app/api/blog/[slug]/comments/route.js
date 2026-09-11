import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogComment from '@/models/BlogComment'
import User from '@/models/User'
import { isPublicPost } from '@/utils/blog'

export async function GET(_request, { params }) {
  try {
    await connectDB()
    const { slug } = await params
    const post = await BlogPost.findOne({ slug }).select('_id commentsEnabled isActive isVisible publishedAt').lean()
    if (!isPublicPost(post) || !post.commentsEnabled) {
      return NextResponse.json({ success: true, comments: [] })
    }

    const comments = await BlogComment.find({ postId: post._id, isApproved: true })
      .populate('userId', 'publicName verified')
      .sort({ createdAt: -1 })
      .limit(80)
      .lean()

    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error('Blog comments GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const { slug } = await params
    const body = await request.json()
    const userId = body.userId
    const text = String(body.body || '').trim()

    if (!userId) {
      return NextResponse.json({ error: 'برای نظر دادن وارد شوید' }, { status: 401 })
    }
    if (text.length < 8) {
      return NextResponse.json({ error: 'نظر باید حداقل ۸ کاراکتر باشد' }, { status: 400 })
    }

    const user = await User.findById(userId).select('_id isActive publicName')
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: 'حساب کاربری معتبر نیست' }, { status: 403 })
    }

    const post = await BlogPost.findOne({ slug })
    if (!isPublicPost(post) || !post.commentsEnabled) {
      return NextResponse.json({ error: 'امکان ثبت نظر برای این مقاله نیست' }, { status: 400 })
    }

    const comment = await BlogComment.create({
      postId: post._id,
      userId,
      body: text,
      isApproved: true,
    })

    const populated = await BlogComment.findById(comment._id)
      .populate('userId', 'publicName verified')
      .lean()

    return NextResponse.json({ success: true, comment: populated })
  } catch (error) {
    console.error('Blog comments POST error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
