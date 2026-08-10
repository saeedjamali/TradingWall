import mongoose from 'mongoose'

const ActivitySchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['book', 'video', 'course', 'article', 'practice', 'other'],
    default: 'other',
  },
  image: {
    type: String,
    default: null,
  },
  link: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
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

// Indexes
ActivitySchema.index({ userId: 1, date: -1 })

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)
