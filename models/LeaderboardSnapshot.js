import mongoose from 'mongoose'

const LeaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  publicName: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  wallPublic: { type: Boolean, default: false },
  rank: { type: Number, required: true, min: 1, max: 10 },
  value: { type: Number, required: true }, // winRate % or profit $
  tradeCount: { type: Number, required: true },
  wins: { type: Number, default: 0 },
}, { _id: false })

const LeaderboardSnapshotSchema = new mongoose.Schema({
  // winrate | profit
  metric: {
    type: String,
    enum: ['winrate', 'profit'],
    required: true,
  },
  // week | month | year
  periodType: {
    type: String,
    enum: ['week', 'month', 'year'],
    required: true,
  },
  // e.g. 2026-W32, 2026-08, 2026
  periodKey: {
    type: String,
    required: true,
  },
  periodLabel: {
    type: String,
    default: '',
  },
  year: Number,
  month: Number, // 1-12
  week: Number,  // week number in year (Sun-start)
  startDate: Date,
  endDate: Date,
  // false = live cache for current period (refresh daily)
  // true = locked historical result
  isFinal: {
    type: Boolean,
    default: false,
  },
  entries: [LeaderboardEntrySchema],
  computedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

LeaderboardSnapshotSchema.index(
  { metric: 1, periodType: 1, periodKey: 1, isFinal: 1 },
  { unique: true }
)
LeaderboardSnapshotSchema.index({ isFinal: 1, periodType: 1, year: -1, month: -1, week: -1 })

export default mongoose.models.LeaderboardSnapshot ||
  mongoose.model('LeaderboardSnapshot', LeaderboardSnapshotSchema)
