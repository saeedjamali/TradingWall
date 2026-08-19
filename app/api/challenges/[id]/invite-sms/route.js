import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BacktestChallenge from '@/models/BacktestChallenge'
import User from '@/models/User'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { sendChallengeInviteSMS } from '@/utils/smsir'
import { normalizePhone } from '@/utils/challenge'

async function findChallenge(id) {
  if (/^[a-f0-9]{24}$/i.test(id)) {
    return BacktestChallenge.findById(id)
  }
  return BacktestChallenge.findOne({ inviteCode: id })
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const { userId, phone } = body

    if (!userId || !phone) {
      return NextResponse.json(
        { error: 'شناسه کاربر و شماره همراه الزامی است' },
        { status: 400 },
      )
    }

    const activeCheck = await requireActiveUser(userId)
    if (activeCheck.error) {
      return NextResponse.json(
        { error: activeCheck.error },
        { status: activeCheck.status },
      )
    }

    const challenge = await findChallenge(id)
    if (!challenge) {
      return NextResponse.json({ error: 'چالش یافت نشد' }, { status: 404 })
    }
    if (String(challenge.creatorId) !== String(userId)) {
      return NextResponse.json({ error: 'فقط سازنده مجاز است' }, { status: 403 })
    }

    const normalized = normalizePhone(phone)
    if (!/^09\d{9}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست (مثال: 09123456789)' },
        { status: 400 },
      )
    }

    const creator = await User.findById(userId).select('publicName').lean()
    const fullName = creator?.publicName || 'کاربر'
    const inviteId = challenge.inviteCode
    const inviteLink = `https://tradingwall.ir/challenges/${inviteId}`

    const sms = await sendChallengeInviteSMS(normalized, fullName, inviteId)

    if (!sms.success) {
      return NextResponse.json({
        success: false,
        error: sms.error || 'ارسال پیامک ناموفق بود',
        inviteLink,
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: 'پیامک دعوت ارسال شد',
      inviteLink,
      phone: normalized,
    })
  } catch (error) {
    console.error('Challenge invite SMS Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
