import mongoose from 'mongoose'

const SetupSchema = new mongoose.Schema({
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
    enum: ['standard', 'custom'],
    required: true,
  },
  // If custom, belongs to a specific user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
SetupSchema.index({ type: 1 })
SetupSchema.index({ userId: 1 })

export default mongoose.models.Setup || mongoose.model('Setup', SetupSchema)
