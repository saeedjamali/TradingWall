import mongoose from 'mongoose'

const PlanSchema = new mongoose.Schema({
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
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  // Plan Details
  maxTrades: {
    type: Number,
    default: null,
  },
  maxLoss: {
    type: Number, // Dollar amount
    default: null,
  },
  maxLossPercent: {
    type: Number, // Percentage of capital
    default: null,
  },
  targetProfit: {
    type: Number,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  mood: {
    type: String,
    enum: ['calm', 'stressed', 'confident', 'anxious', 'focused', 'tired', 'neutral'],
    default: 'neutral',
  },
  tradeImage: {
    type: String,
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

// Composite index for user + date + period
PlanSchema.index({ userId: 1, date: 1, period: 1 }, { unique: true })

export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema)
