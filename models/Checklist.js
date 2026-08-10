import mongoose from 'mongoose'

const ChecklistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  items: [{
    text: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    }
  }],
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Index for performance
ChecklistSchema.index({ userId: 1, order: 1 })

export default mongoose.models.Checklist || mongoose.model('Checklist', ChecklistSchema)
