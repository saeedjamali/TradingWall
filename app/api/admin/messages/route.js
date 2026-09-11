import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message, {
  normalizeMessageThread,
  setUnreadForOthers,
  clearUnreadForUser,
} from '@/models/Message'
import User from '@/models/User'
import Trade from '@/models/Trade'
import Symbol, { SYMBOL_CATEGORIES } from '@/models/Symbol'
import { requireAdmin } from '@/utils/adminAuth'
import { FEEDBACK_CATEGORY_VALUES } from '@/utils/feedbackCategories'
import { normalizeSymbolCode } from '@/utils/symbolMatch'

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

    if (searchParams.get('countOnly') === '1') {
      const inboxCount = await Message.countDocuments({
        type: 'site_feedback',
        $or: [{ adminUnread: true }, { status: 'open' }],
      })
      return NextResponse.json({ success: true, inboxCount })
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
 * PUT /api/admin/messages
 * body: { adminUserId, messageId, replyBody, replyImage? }
 * or { adminUserId, messageId, action: 'approve_symbol' | 'reject_symbol', code, name, nameFa, category }
 */
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, messageId, replyBody, replyImage, action } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!messageId) {
      return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 })
    }

    if (action === 'approve_symbol' || action === 'reject_symbol') {
      const result = await resolveUnknownSymbolTicket({
        adminUserId,
        message,
        action,
        body,
      })
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 })
      }

      const populated = normalizeMessageThread(
        await populateAdmin(Message.findById(messageId)).lean()
      )
      return NextResponse.json({
        success: true,
        message: result.message,
        item: populated,
        deletedCount: result.deletedCount,
      })
    }

    if (!replyBody?.trim()) {
      return NextResponse.json({ error: 'شناسه پیام و متن پاسخ الزامی است' }, { status: 400 })
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
    message.adminUnread = false
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

async function resolveUnknownSymbolTicket({
  adminUserId,
  message,
  action,
  body,
}) {
  const meta = message.meta || {}
  if (message.category !== 'add_symbol' || meta.kind !== 'unknown_symbol') {
    return { error: 'این پیام تیکت نماد جدید نیست' }
  }
  if (meta.resolved) {
    return { error: 'این تیکت قبلاً رسیدگی شده است' }
  }
  if (!message.fromUserId) {
    return { error: 'کاربر ارسال‌کننده مشخص نیست' }
  }

  const originalCode = normalizeSymbolCode(meta.symbolCode)
  if (!originalCode) {
    return { error: 'کد نماد در تیکت موجود نیست' }
  }

  let replyText = ''
  let deletedCount = 0

  if (action === 'approve_symbol') {
    const code = normalizeSymbolCode(body.code || originalCode)
    const name = String(body.name || '').trim()
    const nameFa = String(body.nameFa || '').trim()
    const category = body.category

    if (!code || !name || !category) {
      return { error: 'کد، نام و دسته‌بندی الزامی است' }
    }
    if (!SYMBOL_CATEGORIES.includes(category)) {
      return { error: 'دسته‌بندی نامعتبر است' }
    }

    const existing = await Symbol.findOne({ code })
    if (!existing) {
      await Symbol.create({
        code,
        name,
        nameFa,
        category,
        isActive: true,
        sortOrder: 0,
      })
    } else if (!existing.isActive) {
      existing.isActive = true
      if (name) existing.name = name
      if (nameFa) existing.nameFa = nameFa
      if (category) existing.category = category
      await existing.save()
    }

    await Trade.updateMany(
      {
        userId: message.fromUserId,
        symbol: originalCode,
        symbolPending: true,
      },
      { $set: { symbol: code, symbolPending: false } }
    )

    replyText = existing
      ? `نماد «${originalCode}» بررسی شد و به نماد معتبر «${code}» وصل شد. معاملات شما در ژورنال باقی می‌ماند.`
      : `نماد «${code}» به فهرست نمادهای سامانه اضافه شد. معاملات شما با این نماد در ژورنال باقی می‌ماند.`
  } else {
    const deleted = await Trade.deleteMany({
      userId: message.fromUserId,
      symbol: originalCode,
    })
    deletedCount = deleted.deletedCount || 0
    replyText =
      `نماد «${originalCode}» معتبر نیست و به فهرست نمادها اضافه نشد. ` +
      `${deletedCount} معامله شما با این نماد حذف شد.`
  }

  message.thread.push({
    body: replyText,
    image: null,
    fromUserId: adminUserId,
    createdAt: new Date(),
  })
  message.status = 'replied'
  message.adminUnread = false
  message.meta = {
    ...meta,
    resolved: action === 'approve_symbol' ? 'approved' : 'rejected',
    resolvedAt: new Date().toISOString(),
    resolvedBy: String(adminUserId),
    resolvedCode: action === 'approve_symbol'
      ? normalizeSymbolCode(body.code || originalCode)
      : originalCode,
  }
  setUnreadForOthers(message, adminUserId)
  clearUnreadForUser(message, adminUserId)
  await message.save()

  return {
    message: action === 'approve_symbol' ? 'نماد تایید شد و به کاربر اطلاع داده شد' : 'معاملات حذف شد و به کاربر اطلاع داده شد',
    deletedCount,
  }
}
