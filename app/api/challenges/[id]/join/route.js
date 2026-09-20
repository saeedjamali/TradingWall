import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { challengeAcceptsJoins, getChallengePhase } from '@/utils/challenge'

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
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
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

    const phase = getChallengePhase(challenge)
    if (phase === 'cancelled') {
      return NextResponse.json({ error: 'این چالش لغو شده است' }, { status: 400 })
    }
    if (phase === 'ended' || challenge.status === 'ended') {
      return NextResponse.json({ error: 'مهلت پیوستن به چالش تمام شده است' }, { status: 400 })
    }
    if (!challengeAcceptsJoins(challenge)) {
      return NextResponse.json(
        { error: 'امکان پیوستن به این چالش وجود ندارد' },
        { status: 400 },
      )
    }

    const existing = await ChallengeParticipant.findOne({
      challengeId: challenge._id,
      userId,
    })

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({
          success: true,
          already: true,
          participant: existing,
          message: 'قبلاً در چالش هستید',
        })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({
          success: true,
          already: true,
          participant: existing,
          message: 'درخواست شما در انتظار تایید است',
        })
      }
      if (existing.status === 'rejected' || existing.status === 'left') {
        existing.status = challenge.requireApproval ? 'pending' : 'approved'
        existing.approvedAt = challenge.requireApproval ? null : new Date()
        existing.joinedAt = new Date()
        await existing.save()
        return NextResponse.json({ success: true, participant: existing })
      }
    }

    const approvedCount = await ChallengeParticipant.countDocuments({
      challengeId: challenge._id,
      status: 'approved',
    })

    if (
      challenge.maxParticipants != null &&
      approvedCount >= challenge.maxParticipants &&
      !challenge.requireApproval
    ) {
      return NextResponse.json(
        { error: 'ظرفیت چالش تکمیل شده است' },
        { status: 400 },
      )
    }

    const isCreator = String(challenge.creatorId) === String(userId)
    const status =
      isCreator || !challenge.requireApproval ? 'approved' : 'pending'

    const participant = await ChallengeParticipant.create({
      challengeId: challenge._id,
      userId,
      status,
      approvedAt: status === 'approved' ? new Date() : null,
    })

    return NextResponse.json({
      success: true,
      participant,
      message:
        status === 'pending'
          ? 'درخواست عضویت ارسال شد و منتظر تایید سازنده است'
          : 'با موفقیت به چالش پیوستید',
    })
  } catch (error) {
    console.error('Challenge join Error:', error)
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'قبلاً برای این چالش ثبت‌نام کرده‌اید' },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
