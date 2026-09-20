import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import ChallengeDiscussion from '@/models/ChallengeDiscussion'
import ChallengeDiscussionVote from '@/models/ChallengeDiscussionVote'
import {
  requireChallengeDiscussionAccess,
} from '@/utils/challengeDiscussionAccess'

export const dynamic = 'force-dynamic'

function serializeDiscussion(item, myVotes) {
  const user = item.userId
  return {
    id: String(item._id),
    parentId: item.parentId ? String(item.parentId) : null,
    body: item.body,
    image: item.image || null,
    likeCount: item.likeCount || 0,
    dislikeCount: item.dislikeCount || 0,
    myVote: myVotes.get(String(item._id)) || 0,
    createdAt: item.createdAt,
    user: user
      ? {
          id: String(user._id),
          publicName: user.publicName,
          verified: !!user.verified,
          profileImage: user.profileImage || null,
        }
      : null,
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const access = await requireChallengeDiscussionAccess(id, userId)
    if (access.error) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      )
    }

    const items = await ChallengeDiscussion.find({
      challengeId: access.challenge._id,
    })
      .populate('userId', 'publicName verified profileImage')
      .sort({ createdAt: 1 })
      .limit(300)
      .lean()

    const votes = items.length
      ? await ChallengeDiscussionVote.find({
          discussionId: { $in: items.map((item) => item._id) },
          userId: access.user._id,
        })
          .select('discussionId value')
          .lean()
      : []
    const myVotes = new Map(
      votes.map((vote) => [String(vote.discussionId), vote.value]),
    )

    return NextResponse.json({
      success: true,
      discussions: items.map((item) => serializeDiscussion(item, myVotes)),
    })
  } catch (error) {
    console.error('Challenge discussion GET error:', error)
    return NextResponse.json({ error: 'خطا در دریافت گفتگو' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const payload = await request.json()
    const userId = payload.userId
    const body = String(payload.body || '').trim()
    const parentId = payload.parentId || null
    const image = payload.image ? String(payload.image).trim() : null

    const access = await requireChallengeDiscussionAccess(id, userId)
    if (access.error) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      )
    }

    if (!body) {
      return NextResponse.json(
        { error: 'متن پرسش یا پاسخ الزامی است' },
        { status: 400 },
      )
    }
    if (body.length > 2000) {
      return NextResponse.json(
        { error: 'متن گفتگو نباید بیشتر از ۲۰۰۰ نویسه باشد' },
        { status: 400 },
      )
    }
    if (image && !image.startsWith('/uploads/challenge-discussions/')) {
      return NextResponse.json({ error: 'مسیر تصویر نامعتبر است' }, { status: 400 })
    }

    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) {
        return NextResponse.json({ error: 'شناسه پاسخ نامعتبر است' }, { status: 400 })
      }
      const parent = await ChallengeDiscussion.findOne({
        _id: parentId,
        challengeId: access.challenge._id,
      }).select('_id')
      if (!parent) {
        return NextResponse.json(
          { error: 'پرسش یا پاسخ والد یافت نشد' },
          { status: 404 },
        )
      }
    }

    await ChallengeDiscussion.create({
      challengeId: access.challenge._id,
      userId: access.user._id,
      parentId,
      body,
      image,
    })

    return NextResponse.json(
      { success: true, message: parentId ? 'پاسخ ثبت شد' : 'پرسش ثبت شد' },
      { status: 201 },
    )
  } catch (error) {
    console.error('Challenge discussion POST error:', error)
    return NextResponse.json({ error: 'خطا در ثبت گفتگو' }, { status: 500 })
  }
}
