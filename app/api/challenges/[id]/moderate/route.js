import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import { requireActiveUser } from '@/utils/requireActiveUser'

async function findChallenge(id) {
  if (/^[a-f0-9]{24}$/i.test(id)) {
    return BacktestChallenge.findById(id)
  }
  return BacktestChallenge.findOne({ inviteCode: id })
}

/** Creator approves / rejects a pending participant */
export async function POST(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const { userId, participantId, action } = body // action: approve | reject

    if (!userId || !participantId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'پارامترها ناقص است' }, { status: 400 })
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

    const participant = await ChallengeParticipant.findOne({
      _id: participantId,
      challengeId: challenge._id,
    })
    if (!participant) {
      return NextResponse.json({ error: 'شرکت‌کننده یافت نشد' }, { status: 404 })
    }

    if (action === 'approve') {
      if (challenge.maxParticipants != null) {
        const approvedCount = await ChallengeParticipant.countDocuments({
          challengeId: challenge._id,
          status: 'approved',
        })
        if (approvedCount >= challenge.maxParticipants) {
          return NextResponse.json(
            { error: 'ظرفیت چالش تکمیل است' },
            { status: 400 },
          )
        }
      }
      participant.status = 'approved'
      participant.approvedAt = new Date()
    } else {
      participant.status = 'rejected'
      participant.approvedAt = null
    }

    await participant.save()
    return NextResponse.json({ success: true, participant })
  } catch (error) {
    console.error('Challenge moderate Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
