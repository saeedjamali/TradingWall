import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Trade from '@/models/Trade'
import { requireAdmin } from '@/utils/adminAuth'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const verified = searchParams.get('verified')
    const role = searchParams.get('role')

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const query = {}
    if (search) {
      query.$or = [
        { publicName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }
    if (verified === 'true') query.verified = true
    if (verified === 'false') query.verified = false
    if (role) query.role = role

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    // Attach trade counts
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const tradeCount = await Trade.countDocuments({ userId: user._id })
        const profitAgg = await Trade.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, totalProfit: { $sum: '$profit' } } },
        ])
        return {
          ...user.toObject(),
          tradeCount,
          totalProfit: profitAgg[0]?.totalProfit || 0,
        }
      })
    )

    const total = await User.countDocuments(query)

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Get Users Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// PUT - Update user (role, publicName, etc.)
export async function PUT(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { adminUserId, userId, role, verified, publicName } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 })
    }

    // Prevent admin from demoting themselves
    if (userId === adminUserId && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'نمی‌توانید نقش خودتان را تغییر دهید' },
        { status: 400 }
      )
    }

    const updateData = {}
    if (role !== undefined) updateData.role = role
    if (verified !== undefined) updateData.verified = verified
    if (publicName !== undefined) updateData.publicName = publicName

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'کاربر به‌روزرسانی شد',
      user,
    })
  } catch (error) {
    console.error('Update User Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
