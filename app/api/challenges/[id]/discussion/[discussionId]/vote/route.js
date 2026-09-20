import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import ChallengeDiscussion from '@/models/ChallengeDiscussion'
import ChallengeDiscussionVote from '@/models/ChallengeDiscussionVote'
import {
  requireChallengeDiscussionAccess,
} from '@/utils/challengeDiscussionAccess'

export async function POST(request, { params }) {
  try {
    await connectDB()
    const { id, discussionId } = await params
    const payload = await request.json()
    const userId = payload.userId
    const value = Number(payload.value)

    if (![1, -1].includes(value)) {
      return NextResponse.json({ error: 'رأی نامعتبر است' }, { status: 400 })
    }
    if (!mongoose.isValidObjectId(discussionId)) {
      return NextResponse.json({ error: 'شناسه گفتگو نامعتبر است' }, { status: 400 })
    }

    const access = await requireChallengeDiscussionAccess(id, userId)
    if (access.error) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      )
    }

    const discussion = await ChallengeDiscussion.findOne({
      _id: discussionId,
      challengeId: access.challenge._id,
    })
    if (!discussion) {
      return NextResponse.json({ error: 'گفتگو یافت نشد' }, { status: 404 })
    }

    const existing = await ChallengeDiscussionVote.findOne({
      discussionId: discussion._id,
      userId: access.user._id,
    })

    let myVote = value
    if (existing?.value === value) {
      await existing.deleteOne()
      myVote = 0
    } else if (existing) {
      existing.value = value
      await existing.save()
    } else {
      await ChallengeDiscussionVote.create({
        discussionId: discussion._id,
        userId: access.user._id,
        value,
      })
    }

    const [likeCount, dislikeCount] = await Promise.all([
      ChallengeDiscussionVote.countDocuments({
        discussionId: discussion._id,
        value: 1,
      }),
      ChallengeDiscussionVote.countDocuments({
        discussionId: discussion._id,
        value: -1,
      }),
    ])
    await ChallengeDiscussion.updateOne(
      { _id: discussion._id },
      { $set: { likeCount, dislikeCount } },
    )

    return NextResponse.json({
      success: true,
      likeCount,
      dislikeCount,
      myVote,
    })
  } catch (error) {
    console.error('Challenge discussion vote error:', error)
    return NextResponse.json({ error: 'خطا در ثبت رأی' }, { status: 500 })
  }
}
