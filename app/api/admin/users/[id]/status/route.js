import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAdmin } from '@/utils/adminAuth'

export async function PUT(request, { params }) {
  try {
    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { adminUserId, isActive } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'وضعیت فعال بودن نامعتبر است' },
        { status: 400 }
      )
    }

    if (String(id) === String(adminUserId) && isActive === false) {
      return NextResponse.json(
        { error: 'نمی‌توانید حساب خودتان را غیرفعال کنید' },
        { status: 400 }
      )
    }

    const target = await User.findById(id).select('role')
    if (!target) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password')

    return NextResponse.json({
      success: true,
      message: isActive ? 'کاربر فعال شد' : 'کاربر غیرفعال شد',
      user,
    })
  } catch (error) {
    console.error('Update User Status Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
