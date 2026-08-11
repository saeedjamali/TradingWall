import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

/**
 * GET /api/auth/session?userId=
 * Validates that a stored client session still belongs to an active user.
 */
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 })
    }

    const user = await User.findById(userId).select(
      'publicName phone role verified isActive'
    )

    if (!user) {
      return NextResponse.json(
        { success: false, active: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          active: false,
          error: 'حساب کاربری شما غیرفعال شده است',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      active: true,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        publicName: user.publicName,
        role: user.role,
        verified: !!user.verified,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
