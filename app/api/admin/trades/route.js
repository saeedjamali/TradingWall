import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'
import { requireAdmin } from '@/utils/adminAuth'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('adminUserId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const symbol = searchParams.get('symbol')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const query = {}
    if (symbol) query.symbol = { $regex: symbol, $options: 'i' }
    if (type) query.type = type
    if (userId) query.userId = userId
    if (startDate || endDate) {
      query.closeTime = {}
      if (startDate) query.closeTime.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.closeTime.$lte = end
      }
    }

    const trades = await Trade.find(query)
      .populate('userId', 'publicName phone verified')
      .populate('setupIds', 'title type')
      .sort({ closeTime: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    const total = await Trade.countDocuments(query)

    return NextResponse.json({
      success: true,
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Admin Get Trades Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { adminUserId, tradeId } = body

    const admin = await requireAdmin(adminUserId)
    if (!admin) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (!tradeId) {
      return NextResponse.json({ error: 'شناسه معامله الزامی است' }, { status: 400 })
    }

    const trade = await Trade.findByIdAndDelete(tradeId)
    if (!trade) {
      return NextResponse.json({ error: 'معامله یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'معامله با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin Delete Trade Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
