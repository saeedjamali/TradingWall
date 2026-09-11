import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message, {
  normalizeMessageThread,
  setUnreadForOthers,
  clearUnreadForUser,
} from '@/models/Message'
import User from '@/models/User'
import { FEEDBACK_CATEGORY_VALUES } from '@/utils/feedbackCategories'

function populateMessage(query) {
  return query
    .populate('fromUserId', 'publicName profileImage verified')
    .populate('toUserId', 'publicName profileImage verified')
    .populate('thread.fromUserId', 'publicName profileImage verified role')
    .populate('reply.repliedBy', 'publicName verified')
}

function canParticipate(message, user) {
  if (!user) return false
  const uid = String(user._id || user.id)
  const isSender = String(message.fromUserId) === uid
  const isRecipient = message.toUserId && String(message.toUserId) === uid
  const isAdminOnFeedback = message.type === 'site_feedback' && user.role === 'admin'
  return isSender || isRecipient || isAdminOnFeedback
}

async function countUnreadForUser(userId) {
  const byUnreadBy = await Message.countDocuments({ unreadBy: userId })
  const legacyJob = await Message.countDocuments({
    toUserId: userId,
    type: 'job_offer',
    readByRecipient: false,
    $or: [{ unreadBy: { $exists: false } }, { unreadBy: { $size: 0 } }],
  })
  return byUnreadBy + legacyJob
}

/**
 * GET /api/messages?userId=
 * Optional: type= | box= | countOnly=1
 */
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const box = searchParams.get('box') || 'all'
    const countOnly = searchParams.get('countOnly') === '1'

    if (!userId) {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
    }

    const unreadCount = await countUnreadForUser(userId)

    if (countOnly) {
      return NextResponse.json({ success: true, unreadCount })
    }

    const clauses = []
    if (box === 'sent' || box === 'all') {
      clauses.push({ fromUserId: userId })
    }
    if (box === 'received' || box === 'all') {
      clauses.push({ toUserId: userId, type: 'job_offer' })
    }

    const query = clauses.length > 1 ? { $or: clauses } : clauses[0] || { fromUserId: userId }
    if (type) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { type }]
        delete query.$or
      } else {
        query.type = type
      }
    }

    const raw = await populateMessage(
      Message.find(query).sort({ updatedAt: -1 }).limit(100)
    ).lean()

    const messages = raw.map((m) => normalizeMessageThread(m, userId))

    return NextResponse.json({
      success: true,
      messages,
      unreadCount,
      unreadReceived: unreadCount,
    })
  } catch (error) {
    console.error('Messages GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/**
 * POST /api/messages
 */
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const {
      userId,
      phone,
      type,
      title,
      body: text,
      image,
      toUserId,
      messageId,
      action,
      category,
    } = body

    // Append to existing conversation (requires login)
    if (action === 'continue' || (messageId && !type)) {
      if (!userId) {
        return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
      }
      if (!text?.trim()) {
        return NextResponse.json({ error: 'متن پیام الزامی است' }, { status: 400 })
      }
      if (!messageId) {
        return NextResponse.json({ error: 'شناسه گفتگو الزامی است' }, { status: 400 })
      }

      const user = await User.findById(userId).select('role publicName isActive')
      if (!user) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
      }
      if (user.isActive === false) {
        return NextResponse.json(
          { error: 'حساب کاربری شما غیرفعال است؛ از فرم پشتیبانی صفحه اصلی پیام دهید' },
          { status: 403 }
        )
      }

      const message = await Message.findById(messageId)
      if (!message) {
        return NextResponse.json({ error: 'گفتگو یافت نشد' }, { status: 404 })
      }

      if (!canParticipate(message, user)) {
        return NextResponse.json({ error: 'اجازه ارسال در این گفتگو را ندارید' }, { status: 403 })
      }

      if (message.status === 'closed') {
        return NextResponse.json({ error: 'این گفتگو بسته شده است' }, { status: 400 })
      }

      message.thread.push({
        body: text.trim(),
        image: image || null,
        fromUserId: userId,
        createdAt: new Date(),
      })
      message.status = 'replied'
      if (message.type === 'site_feedback' && user.role !== 'admin') {
        message.adminUnread = true
      }
      setUnreadForOthers(message, userId)
      clearUnreadForUser(message, userId)
      await message.save()

      const populated = normalizeMessageThread(
        await populateMessage(Message.findById(message._id)).lean(),
        userId
      )

      return NextResponse.json({
        success: true,
        message: 'پیام ارسال شد',
        item: populated,
      })
    }

    if (!type || !['site_feedback', 'job_offer'].includes(type)) {
      return NextResponse.json({ error: 'نوع پیام نامعتبر است' }, { status: 400 })
    }
    if (!title?.trim() || !text?.trim()) {
      return NextResponse.json({ error: 'عنوان و متن الزامی است' }, { status: 400 })
    }

    let senderId = userId || null
    let contactPhone = null
    const feedbackCategory = FEEDBACK_CATEGORY_VALUES.includes(category)
      ? category
      : 'other'

    if (type === 'site_feedback') {
      if (senderId) {
        const sender = await User.findById(senderId).select('_id isActive phone')
        if (!sender) {
          return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
        }
        // Inactive users may still send support tickets
        contactPhone = sender.phone || null
      } else if (phone && /^09\d{9}$/.test(String(phone).trim())) {
        contactPhone = String(phone).trim()
        const byPhone = await User.findOne({ phone: contactPhone }).select('_id phone')
        if (byPhone) senderId = byPhone._id
      } else {
        return NextResponse.json(
          { error: 'برای ارسال نظر وارد شوید یا شماره موبایل معتبر وارد کنید' },
          { status: 400 }
        )
      }
    } else {
      if (!senderId) {
        return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
      }
      const sender = await User.findById(senderId).select('_id isActive')
      if (!sender) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
      }
      if (sender.isActive === false) {
        return NextResponse.json(
          { error: 'حساب کاربری شما غیرفعال است' },
          { status: 403 }
        )
      }
    }

    let recipientId = null
    let unreadBy = []

    if (type === 'job_offer') {
      if (!toUserId) {
        return NextResponse.json({ error: 'گیرنده مشخص نشده است' }, { status: 400 })
      }
      if (String(toUserId) === String(senderId)) {
        return NextResponse.json({ error: 'نمی‌توانید به خودتان پیشنهاد بدهید' }, { status: 400 })
      }

      const recipient = await User.findById(toUserId).select('privacySettings')
      if (!recipient) {
        return NextResponse.json({ error: 'کاربر مقصد یافت نشد' }, { status: 404 })
      }
      const privacy = recipient.privacySettings || {}
      if (!privacy.isPublic || !privacy.allowJobOffers) {
        return NextResponse.json(
          { error: 'این کاربر پیشنهاد کاری را فعال نکرده است' },
          { status: 403 }
        )
      }
      recipientId = toUserId
      unreadBy = [toUserId]
    }

    const message = await Message.create({
      type,
      fromUserId: senderId,
      contactPhone,
      category: type === 'site_feedback' ? feedbackCategory : 'other',
      toUserId: recipientId,
      title: title.trim(),
      body: text.trim(),
      image: image || null,
      status: 'open',
      thread: [],
      unreadBy,
      adminUnread: type === 'site_feedback',
      readByRecipient: type === 'site_feedback',
    })

    const populated = normalizeMessageThread(
      await populateMessage(Message.findById(message._id)).lean(),
      senderId
    )

    return NextResponse.json({
      success: true,
      message: type === 'job_offer' ? 'پیشنهاد کاری ارسال شد' : 'نظر شما ارسال شد',
      item: populated,
    })
  } catch (error) {
    console.error('Messages POST Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/**
 * PUT /api/messages
 * action: reply | read | readAll
 */
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { userId, messageId, action, replyBody, replyImage } = body

    if (!userId) {
      return NextResponse.json({ error: 'پارامتر ناقص است' }, { status: 400 })
    }

    if (action === 'readAll') {
      await Message.updateMany(
        { unreadBy: userId },
        { $pull: { unreadBy: userId } }
      )
      await Message.updateMany(
        { toUserId: userId, type: 'job_offer', readByRecipient: false },
        { $set: { readByRecipient: true } }
      )
      const unreadCount = await countUnreadForUser(userId)
      return NextResponse.json({ success: true, unreadCount })
    }

    if (!messageId) {
      return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 })
    }

    if (action === 'read') {
      const uid = String(userId)
      const isParty =
        String(message.fromUserId) === uid ||
        (message.toUserId && String(message.toUserId) === uid)
      if (!isParty) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
      clearUnreadForUser(message, userId)
      await message.save()
      const unreadCount = await countUnreadForUser(userId)
      return NextResponse.json({ success: true, unreadCount })
    }

    if (action === 'reply') {
      if (!replyBody?.trim()) {
        return NextResponse.json({ error: 'متن پاسخ الزامی است' }, { status: 400 })
      }

      const user = await User.findById(userId).select('role')
      if (!user) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
      }

      if (!canParticipate(message, user)) {
        return NextResponse.json({ error: 'اجازه پاسخ ندارید' }, { status: 403 })
      }

      if (message.status === 'closed') {
        return NextResponse.json({ error: 'این گفتگو بسته شده است' }, { status: 400 })
      }

      message.thread.push({
        body: replyBody.trim(),
        image: replyImage || null,
        fromUserId: userId,
        createdAt: new Date(),
      })
      message.status = 'replied'
      setUnreadForOthers(message, userId)
      clearUnreadForUser(message, userId)
      await message.save()

      const populated = normalizeMessageThread(
        await populateMessage(Message.findById(message._id)).lean(),
        userId
      )
      return NextResponse.json({
        success: true,
        message: 'پیام ارسال شد',
        item: populated,
      })
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
  } catch (error) {
    console.error('Messages PUT Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
