import mongoose from 'mongoose'

const ChallengeParticipantSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BacktestChallenge',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'left'],
      default: 'approved',
      index: true,
    },
    invitedPhone: {
      type: String,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

ChallengeParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true })
ChallengeParticipantSchema.index({ userId: 1, status: 1 })

export default mongoose.models.ChallengeParticipant ||
  mongoose.model('ChallengeParticipant', ChallengeParticipantSchema)
