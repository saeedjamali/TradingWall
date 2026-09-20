import mongoose from 'mongoose'

const ChallengeDiscussionSchema = new mongoose.Schema(
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
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChallengeDiscussion',
      default: null,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      default: null,
      maxlength: 500,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislikeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
)

ChallengeDiscussionSchema.index({
  challengeId: 1,
  parentId: 1,
  createdAt: -1,
})

export default mongoose.models.ChallengeDiscussion ||
  mongoose.model('ChallengeDiscussion', ChallengeDiscussionSchema)
