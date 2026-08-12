import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Symbol from '@/models/Symbol'
import { requireAdmin } from '@/utils/adminAuth'
import {
  seedDemoData,
  clearDemoData,
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
        message: 'دیتای دمو حذف شد',
        ...result,
      })
    }

    return NextResponse.json(
      { error: 'action نامعتبر است (seed | clear)' },
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
