import Backtest from '@/models/Backtest'
import Trade from '@/models/Trade'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import BacktestChallenge from '@/models/BacktestChallenge'
// Ensure Setup is registered for populate('setupIds')
import '@/models/Setup'
import {
  buildChallengeStanding,
  buildTradeChallengeStanding,
  challengeDateBounds,
  getChallengePhase,
  resolveChallengeType,
} from '@/utils/challenge'

function symbolFilter(symbol) {
  return {
    $regex: `^${String(symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
    $options: 'i',
  }
}

function sortStandings(standings) {
  return [...standings].sort((a, b) => {
    if ((b.unitNet || 0) !== (a.unitNet || 0)) {
      return (b.unitNet || 0) - (a.unitNet || 0)
    }
    if ((b.progressPct || 0) !== (a.progressPct || 0)) {
      return (b.progressPct || 0) - (a.progressPct || 0)
    }
    if ((b.hitRate || 0) !== (a.hitRate || 0)) {
      return (b.hitRate || 0) - (a.hitRate || 0)
    }
    return (b.count || 0) - (a.count || 0)
  })
}

/**
 * Live compute standings from current backtests / trades.
 */
export async function computeChallengeStandings(challenge) {
  const resolvedType = resolveChallengeType(challenge)
  const isTrade = resolvedType === 'trade'
  const bounds = challengeDateBounds(challenge)
  const filter = symbolFilter(challenge.symbol)

  const approved = await ChallengeParticipant.find({
    challengeId: challenge._id,
    status: 'approved',
  })
    .populate('userId', 'publicName verified profileImage privacySettings')
    .lean()

  const rows = await Promise.all(
    approved.map(async (p) => {
      const u = p.userId
      if (!u) return null
      if (isTrade) {
        const trades = await Trade.find({
          userId: u._id,
          symbol: filter,
          closeTime: { $gte: bounds.start, $lte: bounds.end },
        })
          .populate('setupIds', 'title type')
          .lean()
        return buildTradeChallengeStanding(u, trades, bounds)
      }
      const backtestQuery = {
        userId: u._id,
        symbol: filter,
        date: { $gte: bounds.start, $lte: bounds.end },
      }
      const suggestedId =
        challenge.suggestedSetupId?._id || challenge.suggestedSetupId
      if (suggestedId) {
        backtestQuery.setupIds = suggestedId
      }
      const backtests = await Backtest.find(backtestQuery)
        .populate('setupIds', 'title type')
        .lean()
      return buildChallengeStanding(u, backtests, bounds)
    }),
  )

  return sortStandings(rows.filter(Boolean))
}

/**
 * Persist standings snapshot so results no longer change after end.
 */
export async function freezeChallengeResults(challengeId, standings) {
  const snapshot = {
    frozenAt: new Date(),
    standings: standings || [],
  }
  await BacktestChallenge.findByIdAndUpdate(challengeId, {
    resultsSnapshot: snapshot,
    status: 'ended',
  })
  return snapshot
}

/**
 * For ended/cancelled challenges: return frozen standings (create snapshot if missing).
 * For active/upcoming: always live compute.
 */
export async function getChallengeStandings(challenge) {
  const phase = getChallengePhase(challenge)
  const shouldFreeze = phase === 'ended' || phase === 'cancelled'

  if (shouldFreeze) {
    if (Array.isArray(challenge.resultsSnapshot?.standings)) {
      return {
        standings: challenge.resultsSnapshot.standings,
        frozen: true,
        frozenAt: challenge.resultsSnapshot.frozenAt || null,
      }
    }

    const standings = await computeChallengeStandings(challenge)
    const snapshot = {
      frozenAt: new Date(),
      standings,
    }
    const update = { resultsSnapshot: snapshot }
    // If end date passed but status still open, lock status too
    if (challenge.status === 'open' && phase === 'ended') {
      update.status = 'ended'
    }
    await BacktestChallenge.findByIdAndUpdate(challenge._id, update)
    return { standings, frozen: true, frozenAt: snapshot.frozenAt }
  }

  const standings = await computeChallengeStandings(challenge)
  return { standings, frozen: false, frozenAt: null }
}
