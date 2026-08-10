import mongoose from 'mongoose'

const ChecklistStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  checkedItems: [{
    checklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Checklist',
      required: true,
    },
    itemIndex: {
      type: Number,
      required: true,
    }
  }],
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

// Unique index: one status per user per day
ChecklistStatusSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.models.ChecklistStatus || mongoose.model('ChecklistStatus', ChecklistStatusSchema)
