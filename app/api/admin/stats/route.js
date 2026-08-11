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

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const totalUsers = await User.countDocuments()
    const verifiedUsers = await User.countDocuments({ verified: true })
    const totalTrades = await Trade.countDocuments()
    const adminUsers = await User.countDocuments({ role: 'admin' })

    const profitAggregation = await Trade.aggregate([
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profit' },
        },
      },
    ])

    const totalProfit = profitAggregation[0]?.totalProfit || 0

    // Recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)

    // Recent trades
    const recentTrades = await Trade.find()
      .populate('userId', 'publicName phone verified')
      .sort({ createdAt: -1 })
      .limit(5)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        totalTrades,
        totalProfit,
        adminUsers,
      },
      recentUsers,
      recentTrades,
    })
  } catch (error) {
    console.error('Get Admin Stats Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
