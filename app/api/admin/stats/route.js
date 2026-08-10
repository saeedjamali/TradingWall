import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Trade from '@/models/Trade'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get counts
    const totalUsers = await User.countDocuments()
    const verifiedUsers = await User.countDocuments({ verified: true })
    const totalTrades = await Trade.countDocuments()
    
    // Calculate total profit
    const profitAggregation = await Trade.aggregate([
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profit' }
        }
      }
    ])
    
    const totalProfit = profitAggregation.length > 0 ? profitAggregation[0].totalProfit : 0
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        totalTrades,
        totalProfit,
      },
    })
    
  } catch (error) {
    console.error('Get Admin Stats Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
