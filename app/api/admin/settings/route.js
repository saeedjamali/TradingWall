import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SiteSettings from '@/models/SiteSettings'
import { requireAdmin } from '@/utils/adminAuth'
import {
  DEFAULT_BLOG_CATEGORIES,
  DEFAULT_FEEDBACK_CATEGORIES,
  ensureSiteSettings,
} from '@/utils/siteSettings'

function normalizeCategories(items, defaults) {
  const defaultMap = new Map(defaults.map((item) => [item.slug, item]))
  const seen = new Set()
  const normalized = []

  for (const item of Array.isArray(items) ? items : []) {
    const slug = String(item?.slug || '')
      .trim()
      .toLowerCase()
    const label = String(item?.label || '').trim()
    if (!/^[a-z0-9-]{2,60}$/.test(slug) || !label || seen.has(slug)) continue
    seen.add(slug)
    normalized.push({
      slug,
      label: label.slice(0, 100),
      isActive: item.isActive !== false,
      isSystem: defaultMap.has(slug),
    })
  }

  for (const item of defaults) {
    if (!seen.has(item.slug)) normalized.push(item)
  }
  return normalized
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
