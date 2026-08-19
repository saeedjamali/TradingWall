import mongoose from 'mongoose'
import crypto from 'crypto'

function makeInviteCode() {
  return crypto.randomBytes(5).toString('hex') // 10 chars
}

const BacktestChallengeSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: makeInviteCode,
    },
    /**
     * backtest = تحلیل بک‌تست‌های ثبت‌شده روی چارت تاریخی (نقاط ضعف/قوت)
     * trade = تحلیل معاملات واقعی در بازه (معمولاً آینده)
     * Note: named challengeType (not `type`) to avoid mongoose path quirks.
     */
    challengeType: {
      type: String,
      enum: ['backtest', 'trade'],
      default: 'backtest',
      index: true,
    },
    /** @deprecated use challengeType — kept for older documents */
    type: {
      type: String,
      enum: ['backtest', 'trade'],
    },
    /** Symbol all participants must backtest / trade */
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    /** Optional preferred timeframe hint (not strictly enforced) */
    timeframe: {
      type: String,
      default: '',
    },
    /** Optional suggested standard setup for backtest challenges */
    suggestedSetupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Setup',
      default: null,
    },
    minBacktests: {
      type: Number,
      default: 10,
      min: 1,
    },
    /** Chart days (backtest) or real trade days that count toward coverage */
    backtestRangeStart: {
      type: Date,
      required: true,
    },
    backtestRangeEnd: {
      type: Date,
      required: true,
    },
    /**
     * When participants may join and complete the challenge.
     * Backtest: independent of chart range (e.g. 1 week to backtest 1 month).
     * Trade: always equal to the trade range.
     */
    challengeStartAt: {
      type: Date,
      required: true,
    },
    challengeEndAt: {
      type: Date,
      required: true,
    },
    maxParticipants: {
      type: Number,
      default: null, // null = unlimited
      min: 2,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    /** Who can see the standings table */
    resultsVisibility: {
      type: String,
      enum: ['public', 'participants'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['open', 'ended', 'cancelled'],
      default: 'open',
      index: true,
    },
    /**
     * Frozen standings after challenge ends (by date or manual end).
     * Once set, results must not be recomputed from live data.
     */
    resultsSnapshot: {
      frozenAt: { type: Date, default: null },
      standings: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    },
    rules: {
      type: String,
      default: '',
      maxlength: 3000,
    },
  },
  { timestamps: true },
)

BacktestChallengeSchema.index({ creatorId: 1, createdAt: -1 })
BacktestChallengeSchema.index({ challengeEndAt: 1, status: 1 })

BacktestChallengeSchema.pre('validate', function ensureCode(next) {
  if (!this.inviteCode) this.inviteCode = makeInviteCode()
  next()
})

export function regenerateInviteCode() {
  return makeInviteCode()
}

export default mongoose.models.BacktestChallenge ||
  mongoose.model('BacktestChallenge', BacktestChallengeSchema)
