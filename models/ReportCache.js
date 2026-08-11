import mongoose from 'mongoose'

const ReportCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  computedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.models.ReportCache ||
  mongoose.model('ReportCache', ReportCacheSchema)
