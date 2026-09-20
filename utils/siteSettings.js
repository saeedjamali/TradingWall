import SiteSettings from '@/models/SiteSettings'
import connectDB from '@/lib/mongodb'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'
import { FEEDBACK_CATEGORIES } from '@/utils/feedbackCategories'

export const DEFAULT_BLOG_CATEGORIES = Object.entries(BLOG_CATEGORY_LABELS).map(
  ([slug, label], index) => ({
    slug,
    label,
    isActive: true,
    isSystem: true,
    originKey: slug,
    sortOrder: index,
  }),
)

export const DEFAULT_FEEDBACK_CATEGORIES = FEEDBACK_CATEGORIES.map((item, index) => ({
  slug: item.value,
  label: item.label,
  isActive: true,
  isSystem: true,
  originKey: item.value,
  sortOrder: index,
}))

function mergeMissingDefaults(current = [], defaults = []) {
  const known = new Set()
  for (const item of current) {
    if (item?.slug) known.add(item.slug)
    if (item?.originKey) known.add(item.originKey)
  }
  return [
    ...current.map((item, index) => ({
      ...asPlainCategory(item),
      originKey: item.originKey || (item.isSystem ? item.slug : ''),
      sortOrder: Number.isFinite(Number(item.sortOrder))
        ? Number(item.sortOrder)
        : index,
    })),
    ...defaults
      .filter((item) => !known.has(item.slug))
      .map((item, index) => ({
        ...item,
        originKey: item.slug,
        sortOrder: current.length + index,
      })),
  ]
}

export async function ensureSiteSettings() {
  await connectDB()
  let settings = await SiteSettings.findOne({ key: 'global' })
  if (!settings) {
    settings = await SiteSettings.create({
      key: 'global',
      blogCategories: DEFAULT_BLOG_CATEGORIES,
      feedbackCategories: DEFAULT_FEEDBACK_CATEGORIES,
    })
    return settings
  }

  const blogCategories = mergeMissingDefaults(
    settings.blogCategories,
    DEFAULT_BLOG_CATEGORIES,
  )
  const feedbackCategories = mergeMissingDefaults(
    settings.feedbackCategories,
    DEFAULT_FEEDBACK_CATEGORIES,
  )
  const changed =
    blogCategories.length !== settings.blogCategories.length ||
    feedbackCategories.length !== settings.feedbackCategories.length ||
    settings.blogCategories.some((item, index) => !item.originKey && blogCategories[index]?.originKey) ||
    settings.feedbackCategories.some(
      (item, index) => !item.originKey && feedbackCategories[index]?.originKey,
    )
  if (changed) {
    settings.blogCategories = blogCategories
    settings.feedbackCategories = feedbackCategories
    await settings.save()
  }
  return settings
}

function asPlainCategory(item) {
  if (!item) return item
  return typeof item.toObject === 'function' ? item.toObject() : { ...item }
}

export function toPlainCategories(items = []) {
  return items
    .map((item, index) => {
      const plain = asPlainCategory(item)
      return {
        slug: plain.slug,
        label: plain.label,
        isActive: plain.isActive !== false,
        isSystem: Boolean(plain.isSystem),
        originKey: plain.originKey || '',
        sortOrder: Number.isFinite(Number(plain.sortOrder))
          ? Number(plain.sortOrder)
          : index,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getManagedCategories() {
  const settings = await ensureSiteSettings()
  return {
    blogCategories: toPlainCategories(settings.blogCategories),
    feedbackCategories: toPlainCategories(settings.feedbackCategories),
  }
}

export async function getActiveBlogCategories() {
  const { blogCategories } = await getManagedCategories()
  return blogCategories.filter((item) => item.isActive !== false)
}

export async function getActiveFeedbackCategories() {
  const { feedbackCategories } = await getManagedCategories()
  return feedbackCategories.filter((item) => item.isActive !== false)
}
