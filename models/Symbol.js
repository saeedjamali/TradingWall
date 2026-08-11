import mongoose from 'mongoose'

export const SYMBOL_CATEGORIES = [
  'forex_major',
  'forex_minor',
  'forex_exotic',
  'metals',
  'energy',
  'indices',
  'crypto',
  'stocks',
  'commodities',
  'other',
]

const SymbolSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nameFa: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    enum: SYMBOL_CATEGORIES,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

SymbolSchema.index({ category: 1, sortOrder: 1, code: 1 })

export default mongoose.models.Symbol || mongoose.model('Symbol', SymbolSchema)
