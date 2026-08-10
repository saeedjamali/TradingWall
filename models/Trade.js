import mongoose from 'mongoose'

const TradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Trade Details from MetaTrader
  positionId: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true,
  },
  volume: {
    type: Number,
    required: true,
  },
  openPrice: {
    type: Number,
    required: true,
  },
  closePrice: {
    type: Number,
    required: true,
  },
  stopLoss: {
    type: Number,
    default: null,
  },
  takeProfit: {
    type: Number,
    default: null,
  },
  openTime: {
    type: Date,
    required: true,
    index: true,
  },
  closeTime: {
    type: Date,
    required: true,
    index: true,
  },
  commission: {
    type: Number,
    default: 0,
  },
  swap: {
    type: Number,
    default: 0,
  },
  profit: {
    type: Number,
    required: true,
  },
  // Additional fields
  setupIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Setup',
  }],
  notes: {
    type: String,
    default: '',
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

// Indexes for performance
TradeSchema.index({ userId: 1, openTime: -1 })
TradeSchema.index({ userId: 1, closeTime: -1 })
TradeSchema.index({ userId: 1, profit: -1 })

// Virtual for trade result
TradeSchema.virtual('isWin').get(function() {
  return this.profit > 0
})

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema)
