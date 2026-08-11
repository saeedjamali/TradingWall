import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/utils/adminAuth'

function generateTempPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function POST(request, { params }) {
  try {
    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { adminUserId } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const tempPassword = generateTempPassword(8)
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(tempPassword, salt)
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت ریست شد',
      tempPassword,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        publicName: user.publicName,
      },
    })
  } catch (error) {
    console.error('Reset Password Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
