import mongoose from 'mongoose'

/**
 * Chart / market reality for a day — separate from backtest results.
 * Filled after reviewing the chart: which setup/TF/symbol offered how many TPs.
 */
const MarketRealitySchema = new mongoose.Schema(
  {
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
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    timeframe: {
      type: String,
      default: 'M15',
    },
    setupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Setup',
      required: true,
      index: true,
    },
    /** How many TPs the chart offered for this setup that day */
    tpCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * Optional: how many SL outcomes if the setup was traded.
     * Used for market win rate = tp / (tp + sl)
     */
    slCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
)

MarketRealitySchema.index({ userId: 1, date: -1 })
MarketRealitySchema.index({ userId: 1, setupId: 1 })

export default mongoose.models.MarketReality ||
  mongoose.model('MarketReality', MarketRealitySchema)
