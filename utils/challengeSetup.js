import Setup from '@/models/Setup'

/** Empty / omitted → null. Trade challenges never store a setup. */
export async function resolveSuggestedSetupId(rawId, challengeType) {
  if (challengeType === 'trade') return null
  const id = rawId == null ? '' : String(rawId).trim()
  if (!id) return null
  const setup = await Setup.findById(id).select('_id title type').lean()
  if (!setup || setup.type !== 'standard') {
    const err = new Error('فقط ستاپ استاندارد قابل پیشنهاد است')
    err.status = 400
    throw err
  }
  return setup._id
}

export function serializeSuggestedSetup(challenge) {
  const s = challenge?.suggestedSetupId
  if (!s) return null
  if (typeof s === 'object' && (s.title || s._id)) {
    return {
      _id: String(s._id || s),
      title: s.title || '',
      description: s.description || '',
    }
  }
  return { _id: String(s), title: '', description: '' }
}
