import mongoose from 'mongoose'

const AchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      'winrate_year',
      'winrate_month',
      'winrate_week',
      'profit_year',
      'profit_month',
      'profit_week'
    ],
    required: true,
  },
  rank: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  value: {
    type: Number, // Win rate percentage or profit amount
    required: true,
  },
  period: {
    year: Number,
    month: Number, // 1-12
    week: Number,  // Week number of year
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes
AchievementSchema.index({ userId: 1, createdAt: -1 })
AchievementSchema.index({ category: 1, 'period.year': 1, 'period.month': 1, 'period.week': 1 })

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema)
