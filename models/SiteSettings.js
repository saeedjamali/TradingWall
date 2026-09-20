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
    originKey: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      maxlength: 60,
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

function getSiteSettingsModel() {
  const existing = mongoose.models.SiteSettings
  if (existing) {
    for (const pathName of ['blogCategories', 'feedbackCategories']) {
      const path = existing.schema.path(pathName)
      if (path?.schema && !path.schema.path('originKey')) {
        path.schema.add({
          originKey: {
            type: String,
            default: '',
            trim: true,
            lowercase: true,
            maxlength: 60,
          },
        })
      }
    }
    return existing
  }
  return mongoose.model('SiteSettings', SiteSettingsSchema)
}

export default getSiteSettingsModel()
