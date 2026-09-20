import BacktestChallenge from '@/models/BacktestChallenge'
import ChallengeParticipant from '@/models/ChallengeParticipant'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { requireAdmin } from '@/utils/adminAuth'

export async function findChallengeByParam(param) {
  if (!param) return null
  if (/^[a-f0-9]{10}$/i.test(param)) {
    return BacktestChallenge.findOne({ inviteCode: param })
  }
  if (/^[a-f0-9]{24}$/i.test(param)) {
    return BacktestChallenge.findById(param)
  }
  return BacktestChallenge.findOne({ inviteCode: param })
}

export async function requireChallengeDiscussionAccess(param, userId) {
  const active = await requireActiveUser(userId)
  if (active.error) return active

  const challenge = await findChallengeByParam(param)
  if (!challenge) {
    return { error: 'چالش یافت نشد', status: 404 }
  }

  const [participation, admin] = await Promise.all([
    ChallengeParticipant.findOne({
      challengeId: challenge._id,
      userId: active.user._id,
      status: 'approved',
    }).select('_id'),
    requireAdmin(userId),
  ])

  if (!participation && !admin) {
    return {
      error: 'گفتگو فقط برای شرکت‌کنندگان تاییدشده چالش در دسترس است',
      status: 403,
    }
  }

  return {
    user: active.user,
    challenge,
    isAdmin: !!admin,
  }
}
