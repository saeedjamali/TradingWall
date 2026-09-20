import mongoose from 'mongoose'

export const BLOG_CATEGORIES = [
  'journal',
  'backtest',
  'challenges',
  'psychology',
  'education',
  'tools',
  'market',
]

const FaqSchema = new mongoose.Schema(
  {
    q: { type: String, trim: true, maxlength: 200 },
    a: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
)

const HowToStepSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 160 },
    text: { type: String, trim: true, maxlength: 600 },
  },
  { _id: false },
)

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
      index: true,
    },
    excerpt: { type: String, default: '', trim: true, maxlength: 400 },
    body: { type: String, required: true, maxlength: 80000 },
    coverImage: { type: String, default: null },
    coverImageAlt: { type: String, default: '', trim: true, maxlength: 180 },
    videoUrl: { type: String, default: '', trim: true, maxlength: 500 },
    videoFile: { type: String, default: null },
    gallery: [{ type: String }],
    category: {
      type: String,
      default: 'education',
      index: true,
    },
    categories: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
      default: undefined,
      index: true,
    },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    keywords: [{ type: String, trim: true, maxlength: 60 }],
    focusKeyword: { type: String, default: '', trim: true, maxlength: 80 },
    seoTitle: { type: String, default: '', trim: true, maxlength: 180 },
    seoDescription: { type: String, default: '', trim: true, maxlength: 320 },
    faqs: { type: [FaqSchema], default: [] },
    howToSteps: { type: [HowToStepSchema], default: [] },
    isActive: { type: Boolean, default: false, index: true },
    isVisible: { type: Boolean, default: true, index: true },
    isPinned: { type: Boolean, default: false, index: true },
    pinPriority: { type: Number, default: 0, min: 0, max: 99 },
    commentsEnabled: { type: Boolean, default: true },
    commentsRequireApproval: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null, index: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: { type: String, default: 'دیوار معاملاتی', trim: true },
    views: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

BlogPostSchema.index({ isActive: 1, isVisible: 1, isPinned: -1, pinPriority: -1, publishedAt: -1 })
BlogPostSchema.index({ tags: 1 })

BlogPostSchema.pre('validate', function syncPrimaryCategory(next) {
  const selected = [...new Set((this.categories || []).filter(Boolean))]
  if (selected.length) {
    this.categories = selected
    this.category = selected[0]
  } else if (this.category) {
    this.categories = [this.category]
  }
  next()
})

BlogPostSchema.virtual('ratingAvg').get(function ratingAvg() {
  if (!this.ratingCount) return 0
  return Math.round((this.ratingSum / this.ratingCount) * 10) / 10
})

function getBlogPostModel() {
  const existing = mongoose.models.BlogPost
  if (existing) {
    if (!existing.schema.path('isPinned')) {
      existing.schema.add({
        isPinned: { type: Boolean, default: false, index: true },
        pinPriority: { type: Number, default: 0, min: 0, max: 99 },
      })
    }
    const categoryPath = existing.schema.path('category')
    if (categoryPath?.enumValues?.length) {
      categoryPath.enumValues.splice(0)
      categoryPath.validators = categoryPath.validators.filter(
        (validator) => validator.type !== 'enum',
      )
    }
    if (!existing.schema.path('categories')) {
      existing.schema.add({
        categories: {
          type: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
          default: undefined,
          index: true,
        },
      })
    }
    return existing
  }
  return mongoose.model('BlogPost', BlogPostSchema)
}

export default getBlogPostModel()
