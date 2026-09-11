import mongoose from 'mongoose'

const BlogRatingSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
)

BlogRatingSchema.index({ postId: 1, userId: 1 }, { unique: true })

export default mongoose.models.BlogRating ||
  mongoose.model('BlogRating', BlogRatingSchema)
