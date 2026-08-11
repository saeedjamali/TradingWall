import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message, {
  normalizeMessageThread,
  setUnreadForOthers,
  clearUnreadForUser,
} from '@/models/Message'
import User from '@/models/User'
import { requireAdmin } from '@/utils/adminAuth'
import { FEEDBACK_CATEGORY_VALUES } from '@/utils/feedbackCategories'

function populateAdmin(query) {
  return query
    .populate('fromUserId', 'publicName profileImage phone verified')
    .populate('toUserId', 'publicName profileImage verified')
    .populate('thread.fromUserId', 'publicName profileImage verified role')
    .populate('reply.repliedBy', 'publicName verified')
}

/**
 * GET /api/admin/messages?adminUserId=&type=&status=&category=&phone=
 */
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')
    const type = searchParams.get('type') || 'site_feedback'
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const phone = (searchParams.get('phone') || '').trim()

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const query = {}
    if (type && type !== 'all') query.type = type
    if (status) query.status = status
    if (
      category &&
      FEEDBACK_CATEGORY_VALUES.includes(category) &&
      type !== 'job_offer'
    ) {
      query.category = category
    }

    if (phone) {
      const phoneRegex = new RegExp(phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const matchedUsers = await User.find({ phone: phoneRegex })
        .select('_id')
        .limit(50)
        .lean()
      const userIds = matchedUsers.map((u) => u._id)

      query.$or = [
        { contactPhone: phoneRegex },
        ...(userIds.length ? [{ fromUserId: { $in: userIds } }] : []),
      ]
    }

    const raw = await populateAdmin(
      Message.find(query).sort({ updatedAt: -1 }).limit(200)
    ).lean()

    const messages = raw.map(normalizeMessageThread)

    const openCount = await Message.countDocuments({
      type: 'site_feedback',
      status: 'open',
    })

    return NextResponse.json({
      success: true,
      messages,
      openCount,
    })
  } catch (error) {
    console.error('Admin Messages GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/messages — append reply to thread
 * body: { adminUserId, messageId, replyBody, replyImage? }
 */
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, messageId, replyBody, replyImage } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!messageId || !replyBody?.trim()) {
      return NextResponse.json({ error: 'شناسه پیام و متن پاسخ الزامی است' }, { status: 400 })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 })
    }

    if (message.status === 'closed') {
      return NextResponse.json({ error: 'این گفتگو بسته شده است' }, { status: 400 })
    }

    message.thread.push({
      body: replyBody.trim(),
      image: replyImage || null,
      fromUserId: adminUserId,
      createdAt: new Date(),
    })
    message.status = 'replied'
    setUnreadForOthers(message, adminUserId)
    clearUnreadForUser(message, adminUserId)
    await message.save()

    const populated = normalizeMessageThread(
      await populateAdmin(Message.findById(messageId)).lean()
    )

    return NextResponse.json({
      success: true,
      message: 'پیام ارسال شد',
      item: populated,
    })
  } catch (error) {
    console.error('Admin Messages PUT Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
