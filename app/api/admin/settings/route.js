import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SiteSettings from '@/models/SiteSettings'
import BlogPost from '@/models/BlogPost'
import Message from '@/models/Message'
import { requireAdmin } from '@/utils/adminAuth'
import {
  DEFAULT_BLOG_CATEGORIES,
  DEFAULT_FEEDBACK_CATEGORIES,
  ensureSiteSettings,
} from '@/utils/siteSettings'

function normalizeCategories(items, defaults) {
  const defaultKeys = new Set(defaults.map((item) => item.slug))
  const seenSlug = new Set()
  const seenOrigin = new Set()
  const normalized = []

  for (const item of Array.isArray(items) ? items : []) {
    const slug = String(item?.slug || '')
      .trim()
      .toLowerCase()
    const label = String(item?.label || '').trim()
    const originKey = String(item?.originKey || '')
      .trim()
      .toLowerCase()
    if (!/^[a-z0-9-]{2,60}$/.test(slug) || !label || seenSlug.has(slug)) continue
    const resolvedOrigin =
      originKey && defaultKeys.has(originKey)
        ? originKey
        : defaultKeys.has(slug)
          ? slug
          : ''
    if (resolvedOrigin && seenOrigin.has(resolvedOrigin)) continue
    seenSlug.add(slug)
    if (resolvedOrigin) seenOrigin.add(resolvedOrigin)
    normalized.push({
      slug,
      label: label.slice(0, 100),
      isActive: item.isActive !== false,
      isSystem: Boolean(item.isSystem) || defaultKeys.has(resolvedOrigin || slug),
      originKey: resolvedOrigin,
    })
  }

  for (const item of defaults) {
    if (!seenSlug.has(item.slug) && !seenOrigin.has(item.slug)) {
      normalized.push({ ...item, originKey: item.slug })
    }
  }
  return normalized
}

function slugRenames(previous = [], next = []) {
  const prevByOrigin = new Map(
    previous
      .map((item) => [item.originKey || item.slug, item.slug])
      .filter(([key]) => key),
  )
  const changes = []
  for (const item of next) {
    const key = item.originKey || item.slug
    const oldSlug = prevByOrigin.get(key)
    if (oldSlug && oldSlug !== item.slug) {
      changes.push({ from: oldSlug, to: item.slug })
    }
  }
  return changes
}

async function migrateBlogSlugs(renames) {
  for (const { from, to } of renames) {
    await Promise.all([
      BlogPost.updateMany({ category: from }, { $set: { category: to } }),
      BlogPost.updateMany(
        { categories: from },
        { $set: { 'categories.$[slug]': to } },
        { arrayFilters: [{ slug: from }] },
      ),
    ])
  }
}

async function migrateFeedbackSlugs(renames) {
  for (const { from, to } of renames) {
    await Message.updateMany({ category: from }, { $set: { category: to } })
  }
}

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const admin = await requireAdmin(searchParams.get('adminUserId'))
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const settings = await ensureSiteSettings()
    return NextResponse.json({
      success: true,
      settings: {
        blogCategories: settings.blogCategories,
        feedbackCategories: settings.feedbackCategories,
        misc: settings.misc || {},
      },
    })
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const admin = await requireAdmin(body.adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const previous = await ensureSiteSettings()
    const blogCategories = normalizeCategories(
      body.blogCategories,
      DEFAULT_BLOG_CATEGORIES,
    )
    const feedbackCategories = normalizeCategories(
      body.feedbackCategories,
      DEFAULT_FEEDBACK_CATEGORIES,
    )
    if (!blogCategories.some((item) => item.isActive)) {
      return NextResponse.json(
        { error: 'حداقل یک دسته بلاگ باید فعال باشد' },
        { status: 400 },
      )
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          blogCategories,
          feedbackCategories,
          updatedBy: admin._id,
        },
        $setOnInsert: { key: 'global' },
      },
      { new: true, upsert: true },
    )

    await Promise.all([
      migrateBlogSlugs(slugRenames(previous.blogCategories, blogCategories)),
      migrateFeedbackSlugs(
        slugRenames(previous.feedbackCategories, feedbackCategories),
      ),
    ])

    return NextResponse.json({
      success: true,
      message: 'تنظیمات ذخیره شد',
      settings,
    })
  } catch (error) {
    console.error('Admin settings PUT error:', error)
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 })
  }
}
