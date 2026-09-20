import mongoose from 'mongoose'

const ManagedCategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 60,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
      index: true,
    },
    blogCategories: {
      type: [ManagedCategorySchema],
      default: [],
    },
    feedbackCategories: {
      type: [ManagedCategorySchema],
      default: [],
    },
    misc: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
)

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema)
