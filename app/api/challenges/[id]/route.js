import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import ChallengeDiscussion from '@/models/ChallengeDiscussion'
import ChallengeDiscussionVote from '@/models/ChallengeDiscussionVote'
import User from '@/models/User'
import '@/models/Setup'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { requireAdmin } from '@/utils/adminAuth'
import {
  challengeAcceptsJoins,
  getChallengePhase,
  canViewChallengeResults,
  resolveChallengeType,
  hasOtherParticipants,
  countCalendarDaysInRange,
  challengeDateBounds,
  validateChallengeWindowNotPast,
} from '@/utils/challenge'
import {
  computeChallengeStandings,
  getChallengeStandings,
} from '@/utils/challengeStandings'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { startOfLocalDay, endOfLocalDay } from '@/utils/backtest'
import {
  resolveSuggestedSetupId,
  serializeSuggestedSetup,
} from '@/utils/challengeSetup'

async function loadChallengeByParam(param) {
  if (!param) return null
  const populateSetup = { path: 'suggestedSetupId', select: 'title type description' }
  if (/^[a-f0-9]{10}$/i.test(param)) {
    return BacktestChallenge.findOne({ inviteCode: param })
      .populate(populateSetup)
      .lean()
  }
  if (/^[a-f0-9]{24}$/i.test(param)) {
    return BacktestChallenge.findById(param).populate(populateSetup).lean()
  }
  return BacktestChallenge.findOne({ inviteCode: param })
    .populate(populateSetup)
    .lean()
}

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const viewerId = searchParams.get('viewerId')

    const challenge = await loadChallengeByParam(id)
    if (!challenge) {
      return NextResponse.json({ error: 'چالش یافت نشد' }, { status: 404 })
    }

    const creator = await User.findById(challenge.creatorId)
      .select('publicName verified profileImage privacySettings')
      .lean()

    let viewer = null
    let isAdmin = false
    if (viewerId) {
      const active = await requireActiveUser(viewerId)
      if (!active.error) viewer = active.user
      const admin = await requireAdmin(viewerId)
      isAdmin = !!admin
    }

    const isCreator =
      viewer && String(viewer._id) === String(challenge.creatorId)

    const myParticipation = viewer
      ? await ChallengeParticipant.findOne({
          challengeId: challenge._id,
          userId: viewer._id,
        }).lean()
      : null

    const isParticipant =
      !!myParticipation && myParticipation.status === 'approved'

    const approvedCount = await ChallengeParticipant.countDocuments({
      challengeId: challenge._id,
      status: 'approved',
    })

    const pendingCount = isCreator
      ? await ChallengeParticipant.countDocuments({
          challengeId: challenge._id,
          status: 'pending',
        })
      : 0

    let phase = getChallengePhase(challenge)
    const resolvedType = resolveChallengeType(challenge)
    const activityBounds = challengeDateBounds(challenge)
    const activityDayCount = countCalendarDaysInRange(
      activityBounds.start,
      activityBounds.end,
    )
    const canViewResults = canViewChallengeResults(challenge, {
      isCreator,
      isParticipant,
      isAdmin,
    })

    let participants = []
    let standings = []
    let resultsFrozen = false
    let resultsFrozenAt = null
    let effectivePhase = phase

    if (isCreator || isAdmin) {
      participants = await ChallengeParticipant.find({
        challengeId: challenge._id,
      })
        .populate('userId', 'publicName verified profileImage privacySettings phone')
        .sort({ joinedAt: 1 })
        .lean()
    } else if (canViewResults) {
      participants = await ChallengeParticipant.find({
        challengeId: challenge._id,
        status: 'approved',
      })
        .populate('userId', 'publicName verified profileImage privacySettings')
        .sort({ joinedAt: 1 })
        .lean()
    }

    if (canViewResults) {
      const result = await getChallengeStandings(challenge)
      standings = result.standings
      resultsFrozen = result.frozen
      resultsFrozenAt = result.frozenAt
      if (result.frozen && (phase === 'ended' || phase === 'cancelled')) {
        effectivePhase = phase === 'cancelled' ? 'cancelled' : 'ended'
      }
    }

    const otherJoined = await hasOtherParticipants(
      challenge._id,
      challenge.creatorId,
      ChallengeParticipant,
    )
    const canEditOrDelete =
      !!isCreator &&
      !otherJoined &&
      effectivePhase !== 'ended' &&
      effectivePhase !== 'cancelled'

    return NextResponse.json({
      success: true,
      challenge: {
        ...challenge,
        type: resolvedType,
        challengeType: resolvedType,
        phase: effectivePhase,
        status:
          effectivePhase === 'ended' && challenge.status === 'open'
            ? 'ended'
            : challenge.status,
        approvedCount,
        pendingCount,
        creator,
        resultsFrozen,
        resultsFrozenAt,
        activityDayCount,
        suggestedSetup: serializeSuggestedSetup(challenge),
        suggestedSetupId:
          serializeSuggestedSetup(challenge)?._id ||
          challenge.suggestedSetupId ||
          null,
        acceptsJoins: challengeAcceptsJoins({
          ...challenge,
          status:
            effectivePhase === 'ended' && challenge.status === 'open'
              ? 'ended'
              : challenge.status,
          phase: effectivePhase,
        }),
      },
      viewer: viewer
        ? {
            id: String(viewer._id),
            isCreator,
            isParticipant,
            participationStatus: myParticipation?.status || null,
            isAdmin,
            canEditOrDelete,
          }
        : null,
      canViewResults,
      canEditOrDelete,
      resultsFrozen,
      resultsFrozenAt,
      participants: (isCreator || isAdmin ? participants : []).map((p) => ({
        id: p._id,
        status: p.status,
        joinedAt: p.joinedAt,
        user: p.userId
          ? {
              id: String(p.userId._id),
              publicName: p.userId.publicName,
              verified: p.userId.verified,
              profileImage: p.userId.profileImage,
              phone: isCreator || isAdmin ? p.userId.phone : undefined,
            }
          : null,
      })),
      standings,
    })
  } catch (error) {
    console.error('Challenge GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const {
      userId,
      status,
      title,
      description,
      rules,
      maxParticipants,
      symbol,
      timeframe,
      minBacktests,
      backtestRangeStart,
      backtestRangeEnd,
      challengeStartAt,
      challengeEndAt,
      requireApproval,
      resultsVisibility,
      type,
      challengeType: bodyChallengeType,
      suggestedSetupId: bodySuggestedSetupId,
    } = body

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

    const challenge = await loadChallengeByParam(id)
    if (!challenge) {
      return NextResponse.json({ error: 'چالش یافت نشد' }, { status: 404 })
    }

    if (String(challenge.creatorId) !== String(userId)) {
      return NextResponse.json({ error: 'فقط سازنده چالش مجاز است' }, { status: 403 })
    }

    const otherJoined = await hasOtherParticipants(
      challenge._id,
      challenge.creatorId,
      ChallengeParticipant,
    )

    const update = {}
    if (status === 'ended' || status === 'cancelled' || status === 'open') {
      update.status = status
    }

    const wantsFullEdit =
      title != null ||
      description != null ||
      rules != null ||
      maxParticipants !== undefined ||
      symbol != null ||
      timeframe != null ||
      minBacktests != null ||
      backtestRangeStart != null ||
      backtestRangeEnd != null ||
      challengeStartAt != null ||
      challengeEndAt != null ||
      requireApproval !== undefined ||
      resultsVisibility != null ||
      type != null ||
      bodyChallengeType != null ||
      bodySuggestedSetupId !== undefined

    if (wantsFullEdit && otherJoined) {
      return NextResponse.json(
        {
          error:
            'پس از عضویت دیگران ویرایش ممکن نیست؛ می‌توانید چالش را پایان دهید',
        },
        { status: 400 },
      )
    }

    if (!otherJoined && wantsFullEdit) {
      if (title != null) update.title = String(title).trim().slice(0, 120)
      if (description != null) update.description = String(description).slice(0, 2000)
      if (rules != null) update.rules = String(rules).slice(0, 3000)
      if (maxParticipants !== undefined) {
        update.maxParticipants =
          maxParticipants === null || maxParticipants === ''
            ? null
            : Math.max(2, Number(maxParticipants))
      }
      if (timeframe != null) update.timeframe = String(timeframe)
      if (minBacktests != null) {
        update.minBacktests = Math.max(1, Number(minBacktests) || 1)
      }
      if (requireApproval !== undefined) {
        update.requireApproval = !!requireApproval
        update.resultsVisibility = update.requireApproval
          ? 'participants'
          : 'public'
      }
      const nextType =
        bodyChallengeType === 'trade' || type === 'trade'
          ? 'trade'
          : bodyChallengeType === 'backtest' || type === 'backtest'
            ? 'backtest'
            : null
      if (nextType) {
        update.challengeType = nextType
        update.type = nextType
      }
      if (nextType === 'trade') {
        update.suggestedSetupId = null
      } else if (bodySuggestedSetupId !== undefined) {
        try {
          const setupType = nextType || resolveChallengeType(challenge)
          update.suggestedSetupId = await resolveSuggestedSetupId(
            bodySuggestedSetupId,
            setupType,
          )
        } catch (e) {
          return NextResponse.json(
            { error: e.message || 'ستاپ نامعتبر است' },
            { status: e.status || 400 },
          )
        }
      }
      if (symbol) {
        try {
          await assertActiveSymbol(symbol)
        } catch (e) {
          return NextResponse.json(
            { error: e.message || 'نماد نامعتبر است' },
            { status: 400 },
          )
        }
        update.symbol = String(symbol).trim().toUpperCase()
      }
      const effectiveType =
        nextType || resolveChallengeType(challenge)

      if (effectiveType === 'trade') {
        if (backtestRangeStart || challengeStartAt) {
          const start = startOfLocalDay(backtestRangeStart || challengeStartAt)
          update.backtestRangeStart = start
          update.challengeStartAt = start
        }
        if (backtestRangeEnd || challengeEndAt) {
          const end = endOfLocalDay(backtestRangeEnd || challengeEndAt)
          update.backtestRangeEnd = end
          update.challengeEndAt = end
        }
      } else {
        if (backtestRangeStart) {
          update.backtestRangeStart = startOfLocalDay(backtestRangeStart)
        }
        if (backtestRangeEnd) {
          update.backtestRangeEnd = endOfLocalDay(backtestRangeEnd)
        }
        if (challengeStartAt) {
          update.challengeStartAt = startOfLocalDay(challengeStartAt)
        }
        if (challengeEndAt) {
          update.challengeEndAt = endOfLocalDay(challengeEndAt)
        }
      }

      const btStart = update.backtestRangeStart || challenge.backtestRangeStart
      const btEnd = update.backtestRangeEnd || challenge.backtestRangeEnd
      if (new Date(btEnd) < new Date(btStart)) {
        return NextResponse.json({ error: 'بازه فعالیت نامعتبر است' }, { status: 400 })
      }
      const chStart = update.challengeStartAt || challenge.challengeStartAt
      const chEnd = update.challengeEndAt || challenge.challengeEndAt
      if (new Date(chEnd) < new Date(chStart)) {
        return NextResponse.json({ error: 'بازه چالش نامعتبر است' }, { status: 400 })
      }
      const windowChanged =
        update.challengeStartAt != null ||
        update.challengeEndAt != null ||
        (effectiveType === 'trade' &&
          (update.backtestRangeStart != null || update.backtestRangeEnd != null))
      if (windowChanged) {
        const pastError = validateChallengeWindowNotPast(chStart, chEnd)
        if (pastError) {
          return NextResponse.json({ error: pastError }, { status: 400 })
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'تغییری ارسال نشده است' }, { status: 400 })
    }

    // Freeze results when ending (or cancelling) so later data cannot change the table
    if (status === 'ended' || status === 'cancelled') {
      if (!challenge.resultsSnapshot?.standings) {
        const standings = await computeChallengeStandings(challenge)
        update.resultsSnapshot = {
          frozenAt: new Date(),
          standings,
        }
      }
      update.status = status
    }

    // Do not allow reopening after freeze — keeps historical results intact
    if (status === 'open' && challenge.resultsSnapshot?.standings) {
      return NextResponse.json(
        { error: 'چالش پایان‌یافته قابل بازگشایی نیست؛ نتایج قفل شده‌اند' },
        { status: 400 },
      )
    }

    const updated = await BacktestChallenge.findByIdAndUpdate(
      challenge._id,
      update,
      { new: true },
    ).lean()

    return NextResponse.json({
      success: true,
      challenge: {
        ...updated,
        type: resolveChallengeType(updated),
        challengeType: resolveChallengeType(updated),
      },
    })
  } catch (error) {
    console.error('Challenge PUT Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const userId = body.userId || new URL(request.url).searchParams.get('userId')

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

    const challenge = await loadChallengeByParam(id)
    if (!challenge) {
      return NextResponse.json({ error: 'چالش یافت نشد' }, { status: 404 })
    }

    if (String(challenge.creatorId) !== String(userId)) {
      return NextResponse.json({ error: 'فقط سازنده چالش مجاز است' }, { status: 403 })
    }

    const otherJoined = await hasOtherParticipants(
      challenge._id,
      challenge.creatorId,
      ChallengeParticipant,
    )
    if (otherJoined) {
      return NextResponse.json(
        { error: 'چون فرد دیگری عضو شده، حذف ممکن نیست — می‌توانید چالش را پایان دهید' },
        { status: 400 },
      )
    }

    const discussionIds = await ChallengeDiscussion.find({
      challengeId: challenge._id,
    }).distinct('_id')
    await Promise.all([
      ChallengeParticipant.deleteMany({ challengeId: challenge._id }),
      ChallengeDiscussion.deleteMany({ challengeId: challenge._id }),
      discussionIds.length
        ? ChallengeDiscussionVote.deleteMany({
            discussionId: { $in: discussionIds },
          })
        : Promise.resolve(),
    ])
    await BacktestChallenge.findByIdAndDelete(challenge._id)

    return NextResponse.json({ success: true, message: 'چالش حذف شد' })
  } catch (error) {
    console.error('Challenge DELETE Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
