import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'
import Setup from '@/models/Setup'

// GET: Fetch trades with filters
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const symbol = searchParams.get('symbol')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر مشخص نشده است' },
        { status: 400 }
      )
    }
    
    // Build query
    const query = { userId }
    
    if (symbol) query.symbol = symbol
    if (type) query.type = type
    if (startDate || endDate) {
      query.closeTime = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        query.closeTime.$gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.closeTime.$lte = end
      }
    }
    
    // Execute query with pagination
    const trades = await Trade.find(query)
      .sort({ closeTime: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('setupIds')
    
    const total = await Trade.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
    
  } catch (error) {
    console.error('Get Trades Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// POST: Create new trade
export async function POST(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, ...tradeData } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    // Validate required fields
    const requiredFields = ['positionId', 'symbol', 'type', 'volume', 'openPrice', 'closePrice', 'openTime', 'closeTime', 'profit']
    for (const field of requiredFields) {
      if (!tradeData[field]) {
        return NextResponse.json(
          { error: `فیلد ${field} الزامی است` },
          { status: 400 }
        )
      }
    }
    
    const trade = await Trade.create({
      userId,
      ...tradeData,
    })
    
    return NextResponse.json({
      success: true,
      message: 'معامله با موفقیت ایجاد شد',
      trade,
    })
    
  } catch (error) {
    console.error('Create Trade Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
