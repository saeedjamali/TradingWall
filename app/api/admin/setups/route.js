import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Setup from '@/models/Setup'
import { requireAdmin } from '@/utils/adminAuth'
import { seedDefaultSetups } from '@/utils/setupSeed'

// GET - List standard setups
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const setups = await Setup.find({ type: 'standard' }).sort({ title: 1 })

    return NextResponse.json({
      success: true,
      setups,
    })
  } catch (error) {
    console.error('Admin Get Setups Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// POST - Create standard setup OR seed defaults
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { adminUserId, action, title, description } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (action === 'seed') {
      const result = await seedDefaultSetups(Setup, {
        onlyIfEmpty: body.onlyIfEmpty === true,
      })
      return NextResponse.json({ success: true, ...result })
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'عنوان ستاپ الزامی است' }, { status: 400 })
    }

    const existing = await Setup.findOne({
      type: 'standard',
      title: title.trim(),
    }).lean()
    if (existing) {
      return NextResponse.json(
        { error: 'ستاپی با این عنوان از قبل در لیست استاندارد هست' },
        { status: 400 },
      )
    }

    const setup = await Setup.create({
      title: title.trim(),
      description: description || '',
      type: 'standard',
      userId: null,
    })

    return NextResponse.json({
      success: true,
      message: 'ستاپ استاندارد ایجاد شد',
      setup,
    })
  } catch (error) {
    console.error('Admin Create Setup Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// PUT - Update standard setup
export async function PUT(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { adminUserId, setupId, title, description } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!setupId) {
      return NextResponse.json({ error: 'شناسه ستاپ الزامی است' }, { status: 400 })
    }

    const setup = await Setup.findById(setupId)
    if (!setup || setup.type !== 'standard') {
      return NextResponse.json({ error: 'ستاپ استاندارد یافت نشد' }, { status: 404 })
    }

    if (title !== undefined) setup.title = title.trim()
    if (description !== undefined) setup.description = description
    await setup.save()

    return NextResponse.json({
      success: true,
      message: 'ستاپ به‌روزرسانی شد',
      setup,
    })
  } catch (error) {
    console.error('Admin Update Setup Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// DELETE - Delete standard setup
export async function DELETE(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { adminUserId, setupId } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!setupId) {
      return NextResponse.json({ error: 'شناسه ستاپ الزامی است' }, { status: 400 })
    }

    const setup = await Setup.findById(setupId)
    if (!setup || setup.type !== 'standard') {
      return NextResponse.json({ error: 'ستاپ استاندارد یافت نشد' }, { status: 404 })
    }

    await Setup.findByIdAndDelete(setupId)

    return NextResponse.json({
      success: true,
      message: 'ستاپ حذف شد',
    })
  } catch (error) {
    console.error('Admin Delete Setup Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
