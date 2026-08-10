import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import Setup from '@/models/Setup'

// GET: Fetch plans
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const period = searchParams.get('period')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر مشخص نشده است' },
        { status: 400 }
      )
    }
    
    // Build query
    const query = { userId }
    if (date) query.date = new Date(date)
    if (period) query.period = period
    
    const plans = await Plan.find(query)
      .sort({ date: -1 })
    
    return NextResponse.json({
      success: true,
      plans,
    })
    
  } catch (error) {
    console.error('Get Plans Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// POST: Create plan
export async function POST(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, ...planData } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    const selectedDate = new Date(planData.date)
    const period = planData.period
    
    // Calculate date range based on period
    let startDate, endDate
    
    if (period === 'daily') {
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'weekly') {
      // Get start of week (Sunday)
      startDate = new Date(selectedDate)
      const dayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      
      // Get end of week (Saturday)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'monthly') {
      // Get start of month
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      
      // Get end of month
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
    }
    
    // Check if plan already exists first (before deleting anything)
    let existingPlan = null
    
    if (period === 'daily') {
      // For daily, check exact date
      existingPlan = await Plan.findOne({
        userId,
        date: selectedDate,
        period: 'daily',
      })
    } else if (period === 'weekly') {
      // For weekly, check if any weekly plan exists in this week range
      existingPlan = await Plan.findOne({
        userId,
        period: 'weekly',
        date: { $gte: startDate, $lte: endDate }
      })
    } else if (period === 'monthly') {
      // For monthly, check if any monthly plan exists in this month range
      existingPlan = await Plan.findOne({
        userId,
        period: 'monthly',
        date: { $gte: startDate, $lte: endDate }
      })
    }
    
    if (existingPlan) {
      return NextResponse.json(
        { error: period === 'daily' 
          ? 'پلن روزانه‌ای برای این تاریخ از قبل وجود دارد'
          : period === 'weekly'
          ? 'پلن هفتگی‌ای برای این هفته از قبل وجود دارد'
          : 'پلن ماهانه‌ای برای این ماه از قبل وجود دارد'
        },
        { status: 400 }
      )
    }
    
    // Delete existing plans based on period hierarchy
    if (period === 'daily') {
      // Daily plans don't delete anything - they override weekly/monthly
      // No deletion needed
    } else if (period === 'weekly') {
      // Weekly plans delete only daily plans in the week
      await Plan.deleteMany({
        userId,
        period: 'daily',
        date: { $gte: startDate, $lte: endDate }
      })
      
      // Delete other weekly plans that overlap with this week (shouldn't happen due to check above)
      await Plan.deleteMany({
        userId,
        period: 'weekly',
        date: { $gte: startDate, $lte: endDate }
      })
    } else if (period === 'monthly') {
      // Monthly plans delete daily and weekly plans in the month
      await Plan.deleteMany({
        userId,
        period: { $in: ['daily', 'weekly'] },
        date: { $gte: startDate, $lte: endDate }
      })
      
      // Delete other monthly plans in same month (shouldn't happen due to check above)
      await Plan.deleteMany({
        userId,
        period: 'monthly',
        date: { $gte: startDate, $lte: endDate }
      })
    }
    
    // Clean up planData - remove undefined/null setupId
    const cleanPlanData = { ...planData }
    if (!cleanPlanData.setupId) {
      delete cleanPlanData.setupId
    }
    
    const plan = await Plan.create({
      userId,
      ...cleanPlanData,
    })
    
    return NextResponse.json({
      success: true,
      message: period === 'daily' 
        ? 'پلن روزانه با موفقیت ایجاد شد'
        : period === 'weekly'
        ? 'پلن هفتگی برای کل هفته ایجاد شد'
        : 'پلن ماهانه برای کل ماه ایجاد شد',
      plan,
      dateRange: period !== 'daily' ? { startDate, endDate } : null,
    })
    
  } catch (error) {
    console.error('Create Plan Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
