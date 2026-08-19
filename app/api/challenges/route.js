import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import '@/models/Setup'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { startOfLocalDay, endOfLocalDay } from '@/utils/backtest'
import { getChallengePhase, resolveChallengeType, validateChallengeWindowNotPast } from '@/utils/challenge'
import { resolveSuggestedSetupId, serializeSuggestedSetup } from '@/utils/challengeSetup'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const viewerId = searchParams.get('viewerId')
    const scope = searchParams.get('scope') || 'mine' // mine | open | public

    // Public discovery — no login required
    if (scope === 'public') {
      const typeFilter = searchParams.get('type') // backtest | trade | ''
      const symbol = (searchParams.get('symbol') || '').trim().toUpperCase()
      const timeframe = (searchParams.get('timeframe') || '').trim()
      const q = (searchParams.get('q') || '').trim()
      const phaseFilter = searchParams.get('phase') // upcoming | active | ended | ''
      const accessFilter = searchParams.get('access') // public | private | ''
      const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 60))

      const query = {
        status: { $ne: 'cancelled' },
      }
      const and = []

      if (accessFilter === 'public') {
        query.requireApproval = { $ne: true }
      } else if (accessFilter === 'private') {
        query.requireApproval = true
      }

      if (symbol) {
        query.symbol = { $regex: `^${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' }
      }
      if (timeframe) {
        query.timeframe = timeframe
      }
      if (q) {
        and.push({
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { symbol: { $regex: q, $options: 'i' } },
          ],
        })
      }
      if (and.length) query.$and = and

      const challenges = await BacktestChallenge.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(200, Math.max(limit * 4, 80)))
        .populate('creatorId', 'publicName verified')
        .populate('suggestedSetupId', 'title')
        .lean()

      let viewerParticipationMap = {}
      if (viewerId) {
        const active = await requireActiveUser(viewerId)
        if (!active.error) {
          const parts = await ChallengeParticipant.find({
            userId: viewerId,
            challengeId: { $in: challenges.map((c) => c._id) },
            status: { $in: ['pending', 'approved'] },
          }).lean()
          viewerParticipationMap = Object.fromEntries(
            parts.map((p) => [String(p.challengeId), p.status]),
          )
        }
      }

      let withMeta = await Promise.all(
        challenges.map(async (c) => {
          const approved = await ChallengeParticipant.countDocuments({
            challengeId: c._id,
            status: 'approved',
          })
          const resolvedType = resolveChallengeType(c)
          return {
            ...c,
            type: resolvedType,
            challengeType: resolvedType,
            phase: getChallengePhase(c),
            approvedCount: approved,
            creator: c.creatorId,
            creatorId: c.creatorId?._id || c.creatorId,
            suggestedSetup: serializeSuggestedSetup(c),
            myStatus: viewerParticipationMap[String(c._id)] || null,
          }
        }),
      )

      if (typeFilter === 'trade' || typeFilter === 'backtest') {
        withMeta = withMeta.filter((c) => c.type === typeFilter)
      }
      if (phaseFilter && ['upcoming', 'active', 'ended'].includes(phaseFilter)) {
        withMeta = withMeta.filter((c) => c.phase === phaseFilter)
      }

      return NextResponse.json({
        success: true,
        challenges: withMeta.slice(0, limit),
      })
    }

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

    if (scope === 'open') {
      const now = new Date()
      const challenges = await BacktestChallenge.find({
        status: 'open',
        $or: [
          { backtestRangeEnd: { $gte: now } },
          { challengeEndAt: { $gte: now } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('creatorId', 'publicName verified')
        .populate('suggestedSetupId', 'title')
        .lean()

      const withMeta = await Promise.all(
        challenges.map(async (c) => {
          const approved = await ChallengeParticipant.countDocuments({
            challengeId: c._id,
            status: 'approved',
          })
          return {
            ...c,
            type: resolveChallengeType(c),
            challengeType: resolveChallengeType(c),
            phase: getChallengePhase(c),
            approvedCount: approved,
            creator: c.creatorId,
            creatorId: c.creatorId?._id || c.creatorId,
            suggestedSetup: serializeSuggestedSetup(c),
          }
        }),
      )

      return NextResponse.json({ success: true, challenges: withMeta })
    }

    const created = await BacktestChallenge.find({ creatorId: userId })
      .sort({ createdAt: -1 })
      .populate('suggestedSetupId', 'title')
      .lean()

    const participations = await ChallengeParticipant.find({
      userId,
      status: { $in: ['pending', 'approved'] },
    })
      .populate({
        path: 'challengeId',
        populate: [
          { path: 'creatorId', select: 'publicName verified' },
          { path: 'suggestedSetupId', select: 'title' },
        ],
      })
      .lean()

    const joined = participations
      .filter((p) => p.challengeId)
      .map((p) => ({
        ...p.challengeId,
        type: resolveChallengeType(p.challengeId),
        challengeType: resolveChallengeType(p.challengeId),
        phase: getChallengePhase(p.challengeId),
        participationStatus: p.status,
        creator: p.challengeId.creatorId,
        creatorId: p.challengeId.creatorId?._id || p.challengeId.creatorId,
        suggestedSetup: serializeSuggestedSetup(p.challengeId),
      }))

    const createdMapped = await Promise.all(
      created.map(async (c) => {
        const approved = await ChallengeParticipant.countDocuments({
          challengeId: c._id,
          status: 'approved',
        })
        return {
          ...c,
          type: resolveChallengeType(c),
          challengeType: resolveChallengeType(c),
          phase: getChallengePhase(c),
          approvedCount: approved,
          participationStatus: 'creator',
          suggestedSetup: serializeSuggestedSetup(c),
        }
      }),
    )

    return NextResponse.json({
      success: true,
      created: createdMapped,
      joined,
    })
  } catch (error) {
    console.error('Challenges GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const {
      userId,
      title,
      description,
      type,
      challengeType: bodyChallengeType,
      symbol,
      timeframe,
      minBacktests,
      backtestRangeStart,
      backtestRangeEnd,
      challengeStartAt,
      challengeEndAt,
      maxParticipants,
      requireApproval,
      rules,
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

    if (!title?.trim() || !symbol || !backtestRangeStart || !backtestRangeEnd) {
      return NextResponse.json(
        { error: 'عنوان، نماد و بازه زمانی الزامی است' },
        { status: 400 },
      )
    }

    const challengeType =
      bodyChallengeType === 'trade' || type === 'trade' ? 'trade' : 'backtest'

    try {
      await assertActiveSymbol(symbol)
    } catch (e) {
      return NextResponse.json(
        { error: e.message || 'نماد نامعتبر است' },
        { status: 400 },
      )
    }

    const btStart = startOfLocalDay(backtestRangeStart)
    const btEnd = endOfLocalDay(backtestRangeEnd)

    if (btEnd < btStart) {
      return NextResponse.json(
        {
          error:
            challengeType === 'trade'
              ? 'بازه معاملات نامعتبر است'
              : 'بازه چارت نامعتبر است',
        },
        { status: 400 },
      )
    }

    let chStart
    let chEnd
    if (challengeType === 'trade') {
      // Trades must happen on their own days — challenge window = trade range
      chStart = btStart
      chEnd = btEnd
    } else {
      if (!challengeStartAt || !challengeEndAt) {
        return NextResponse.json(
          { error: 'بازه چالش (مهلت انجام بک‌تست) الزامی است' },
          { status: 400 },
        )
      }
      chStart = startOfLocalDay(challengeStartAt)
      chEnd = endOfLocalDay(challengeEndAt)
      if (chEnd < chStart) {
        return NextResponse.json(
          { error: 'بازه چالش نامعتبر است' },
          { status: 400 },
        )
      }
    }

    const pastError = validateChallengeWindowNotPast(chStart, chEnd)
    if (pastError) {
      return NextResponse.json({ error: pastError }, { status: 400 })
    }

    let suggestedSetupId = null
    try {
      suggestedSetupId = await resolveSuggestedSetupId(
        bodySuggestedSetupId,
        challengeType,
      )
    } catch (e) {
      return NextResponse.json(
        { error: e.message || 'ستاپ نامعتبر است' },
        { status: e.status || 400 },
      )
    }

    const needsApproval = !!requireApproval

    const challenge = await BacktestChallenge.create({
      creatorId: userId,
      title: title.trim(),
      description: description || '',
      challengeType,
      type: challengeType,
      symbol: String(symbol).trim().toUpperCase(),
      timeframe: timeframe || '',
      minBacktests: Math.max(1, Number(minBacktests) || 1),
      backtestRangeStart: btStart,
      backtestRangeEnd: btEnd,
      challengeStartAt: chStart,
      challengeEndAt: chEnd,
      maxParticipants:
        maxParticipants === null || maxParticipants === '' || maxParticipants === undefined
          ? null
          : Math.max(2, Number(maxParticipants)),
      requireApproval: needsApproval,
      resultsVisibility: needsApproval ? 'participants' : 'public',
      suggestedSetupId,
      rules: rules || '',
      status: 'open',
    })

    // Creator auto-joins as approved
    await ChallengeParticipant.create({
      challengeId: challenge._id,
      userId,
      status: 'approved',
      approvedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      challenge,
      invitePath: `/challenges/${challenge.inviteCode}`,
    })
  } catch (error) {
    console.error('Challenges POST Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
