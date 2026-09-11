import mongoose from 'mongoose'

const BlogCommentSchema = new mongoose.Schema(
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
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 1500 },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

BlogCommentSchema.index({ postId: 1, createdAt: -1 })

export default mongoose.models.BlogComment ||
  mongoose.model('BlogComment', BlogCommentSchema)
