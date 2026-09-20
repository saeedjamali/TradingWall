import mongoose from 'mongoose'

const ChallengeDiscussionVoteSchema = new mongoose.Schema(
  {
    discussionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChallengeDiscussion',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
  },
  { timestamps: true },
)

ChallengeDiscussionVoteSchema.index(
  { discussionId: 1, userId: 1 },
  { unique: true },
)

export default mongoose.models.ChallengeDiscussionVote ||
  mongoose.model('ChallengeDiscussionVote', ChallengeDiscussionVoteSchema)
