import mongoose from 'mongoose'

const SiteLogSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['page_view', 'action'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
      maxlength: 80,
    },
    path: {
      type: String,
      default: '',
      index: true,
      maxlength: 400,
    },
    method: {
      type: String,
      default: '',
      maxlength: 10,
    },
    status: {
      type: Number,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visitorId: {
      type: String,
      default: '',
      index: true,
      maxlength: 64,
    },
    ip: {
      type: String,
      default: '',
      maxlength: 80,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 240,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

SiteLogSchema.index({ createdAt: -1 })
SiteLogSchema.index({ kind: 1, createdAt: -1 })
SiteLogSchema.index({ action: 1, createdAt: -1 })
SiteLogSchema.index({ path: 1, createdAt: -1 })

export default mongoose.models.SiteLog || mongoose.model('SiteLog', SiteLogSchema)
