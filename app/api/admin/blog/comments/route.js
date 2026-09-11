import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogComment from '@/models/BlogComment'
import { requireAdmin } from '@/utils/adminAuth'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const admin = await requireAdmin(searchParams.get('adminUserId'))
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })

    const postId = searchParams.get('postId')
    const filter = {}
    if (postId) filter.postId = postId

    const comments = await BlogComment.find(filter)
      .populate('userId', 'publicName phone')
      .populate('postId', 'title slug')
      .sort({ isApproved: 1, createdAt: -1 })
      .limit(200)
      .lean()

    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error('Admin blog comments GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })

    const comment = await BlogComment.findById(body.commentId)
    if (!comment) return NextResponse.json({ error: 'نظر یافت نشد' }, { status: 404 })
    comment.isApproved = body.isApproved !== false
    await comment.save()
    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Admin blog comments PUT error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })

    const deleted = await BlogComment.findByIdAndDelete(body.commentId)
    if (!deleted) return NextResponse.json({ error: 'نظر یافت نشد' }, { status: 404 })
    return NextResponse.json({ success: true, message: 'نظر حذف شد' })
  } catch (error) {
    console.error('Admin blog comments DELETE error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
