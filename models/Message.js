import mongoose from 'mongoose'

const ThreadItemSchema = new mongoose.Schema({
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  image: { type: String, default: null },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true })

const MessageSchema = new mongoose.Schema({
  // site_feedback → به ادمین | job_offer → به کاربر دیوار
  type: {
    type: String,
    enum: ['site_feedback', 'job_offer'],
    required: true,
    index: true,
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true,
  },
  // Guest / inactive support contact when session login is not possible
  contactPhone: {
    type: String,
    default: null,
    index: true,
  },
  // null for site_feedback; wall owner for job_offer
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  category: {
    type: String,
    enum: [
      'add_symbol',
      'add_setup',
      'upload_error',
      'account_activation',
      'login_issue',
      'bug_report',
      'feature_request',
      'other',
    ],
    default: 'other',
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  image: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'replied', 'closed'],
    default: 'open',
    index: true,
  },
  /** Conversation thread (Q&A) after the initial message */
  thread: {
    type: [ThreadItemSchema],
    default: [],
  },
  /** @deprecated kept for older documents — prefer thread */
  reply: {
    type: new mongoose.Schema({
      body: String,
      image: String,
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      repliedAt: Date,
    }, { _id: false }),
    default: null,
  },
  /** Users who have unread updates on this conversation */
  unreadBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  readByRecipient: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

MessageSchema.index({ type: 1, createdAt: -1 })
MessageSchema.index({ fromUserId: 1, createdAt: -1 })
MessageSchema.index({ toUserId: 1, createdAt: -1 })
MessageSchema.index({ unreadBy: 1 })

/**
 * Normalize legacy single `reply` into `thread` for API responses
 */
export function normalizeMessageThread(doc, viewerId = null) {
  if (!doc) return doc
  const msg = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  const thread = Array.isArray(msg.thread) ? [...msg.thread] : []

  if (thread.length === 0 && msg.reply?.body) {
    thread.push({
      _id: 'legacy-reply',
      body: msg.reply.body,
      image: msg.reply.image || null,
      fromUserId: msg.reply.repliedBy,
      createdAt: msg.reply.repliedAt || msg.updatedAt,
    })
  }

  msg.thread = thread

  if (viewerId) {
    const unreadList = (msg.unreadBy || []).map((id) => String(id))
    // Legacy: job offer unread via readByRecipient
    const legacyUnread =
      msg.type === 'job_offer' &&
      String(msg.toUserId?._id || msg.toUserId) === String(viewerId) &&
      msg.readByRecipient === false &&
      unreadList.length === 0 &&
      (!msg.unreadBy || msg.unreadBy.length === 0)

    msg.isUnread = unreadList.includes(String(viewerId)) || legacyUnread
  }

  return msg
}

/** Mark conversation unread for users (except actor) */
export function setUnreadForOthers(message, actorUserId) {
  const actor = String(actorUserId)
  const targets = new Set()

  if (message.fromUserId && String(message.fromUserId) !== actor) {
    targets.add(String(message.fromUserId))
  }
  if (message.toUserId && String(message.toUserId) !== actor) {
    targets.add(String(message.toUserId))
  }

  const current = (message.unreadBy || []).map((id) => String(id))
  const merged = new Set([...current.filter((id) => id !== actor), ...targets])
  message.unreadBy = [...merged]
}

export function clearUnreadForUser(message, userId) {
  const uid = String(userId)
  message.unreadBy = (message.unreadBy || []).filter((id) => String(id) !== uid)
  if (message.toUserId && String(message.toUserId) === uid) {
    message.readByRecipient = true
  }
}

export default mongoose.models.Message || mongoose.model('Message', MessageSchema)
