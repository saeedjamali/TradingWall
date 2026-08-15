import mongoose from 'mongoose'

const BacktestSchema = new mongoose.Schema(
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
    direction: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    session: {
      type: String,
      enum: ['asian', 'london', 'newyork', 'overlap', 'other'],
      default: 'other',
    },
    setupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Setup',
      },
    ],
    marketCondition: {
      type: String,
      default: '',
    },
    entryReason: {
      type: String,
      default: '',
    },
    entry: {
      type: Number,
      default: null,
    },
    sl: {
      type: Number,
      default: null,
    },
    tp: {
      type: Number,
      default: null,
    },
    /** Risk per unit in $ (optional size of one SL) */
    risk: {
      type: Number,
      default: null,
    },
    rr: {
      type: Number,
      default: null,
    },
    /** How many SL hits in this backtest */
    slHits: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** How many TP hits in this backtest */
    tpHits: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * Net result in $ = (tpHits - slHits) * risk
     * When risk is null, stored as null (counts still tracked).
     */
    resultPnL: {
      type: Number,
      default: null,
    },
    weaknesses: {
      type: String,
      default: '',
    },
    strengths: {
      type: String,
      default: '',
    },
    lesson: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    tradeImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

BacktestSchema.index({ userId: 1, date: -1 })
BacktestSchema.index({ userId: 1, symbol: 1 })

export default mongoose.models.Backtest ||
  mongoose.model('Backtest', BacktestSchema)
