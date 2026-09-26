import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Symbol from '@/models/Symbol'
import { requireAdmin } from '@/utils/adminAuth'
import {
  seedDemoData,
  clearDemoData,
  seedDemoBlogPosts,
  clearDemoBlogPosts,
  seedDemoSetups,
  clearDemoSetups,
  getDemoDataStatus,
  DEMO_PASSWORD,
} from '@/utils/demoSeed'

// GET — status of demo data
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const status = await getDemoDataStatus()
    return NextResponse.json({
      success: true,
      status,
      demoPassword: DEMO_PASSWORD,
    })
  } catch (error) {
    console.error('Admin Demo Data GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// POST — seed or clear
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { adminUserId, action, replace } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (action === 'seed') {
      const result = await seedDemoData({
        SymbolModel: Symbol,
        replace: replace === true,
      })
      return NextResponse.json({
        success: true,
        action: 'seed',
        ...result,
      })
    }

    if (action === 'clear') {
      const result = await clearDemoData()
      return NextResponse.json({
        success: true,
        action: 'clear',
        message: 'دیتای دمو کاربران حذف شد',
        ...result,
      })
    }

    if (action === 'seed-blog') {
      const result = await seedDemoBlogPosts()
      return NextResponse.json({
        success: true,
        action: 'seed-blog',
        message: 'پست‌های بلاگ دمو همگام شد؛ بازدید و امتیاز پست‌های قبلی حفظ شد',
        createdBlogPosts: result.created,
        updatedBlogPosts: result.updated,
        totalBlogPosts: result.total,
      })
    }

    if (action === 'clear-blog') {
      const result = await clearDemoBlogPosts()
      return NextResponse.json({
        success: true,
        action: 'clear-blog',
        message: 'پست‌های بلاگ دمو حذف شد',
        ...result,
      })
    }

    if (action === 'seed-setup') {
      const result = await seedDemoSetups()
      return NextResponse.json({
        success: true,
        action: 'seed-setup',
        message:
          result.demoUserCount === 0
            ? 'ستاپ‌های استاندارد همگام شد. برای ستاپ کاربران دمو اول کاربران را بسازید.'
            : 'ستاپ‌های استاندارد و ستاپ کاربران دمو همگام شد',
        createdSetups: result.created,
        skippedUsers: result.skippedUsers,
        demoUserCount: result.demoUserCount,
        standardInserted: result.standardInserted,
        standardSkipped: result.standardSkipped,
        standardTotal: result.standardTotal,
      })
    }

    if (action === 'clear-setup') {
      const result = await clearDemoSetups()
      return NextResponse.json({
        success: true,
        action: 'clear-setup',
        message: 'ستاپ‌های کاربران دمو حذف شد؛ ستاپ‌های استاندارد باقی ماند',
        ...result,
      })
    }

    return NextResponse.json(
      { error: 'action نامعتبر است (seed | clear | seed-blog | clear-blog | seed-setup | clear-setup)' },
      { status: 400 },
    )
  } catch (error) {
    console.error('Admin Demo Data POST Error:', error)
    return NextResponse.json(
      { error: error.message || 'خطای سرور' },
      { status: 500 },
    )
  }
}
