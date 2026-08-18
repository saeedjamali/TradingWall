import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MarketReality from '@/models/MarketReality'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { startOfLocalDay } from '@/utils/backtest'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
    }

    const activeCheck = await requireActiveUser(userId)
    if (activeCheck.error) {
      return NextResponse.json(
        { error: activeCheck.error },
        { status: activeCheck.status },
      )
    }

    const query = { userId }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        query.date.$gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }

    const items = await MarketReality.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('setupId', 'title type')
      .lean()

    return NextResponse.json({ success: true, marketRealities: items })
  } catch (error) {
    console.error('Get MarketReality Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { userId, date, symbol, timeframe, setupId, tpCount, slCount, notes } =
      body

    if (!userId) {
      return NextResponse.json({ error: 'کاربر مشخص نشده است' }, { status: 400 })
    }

    const activeCheck = await requireActiveUser(userId)
    if (activeCheck.error) {
      return NextResponse.json(
        { error: activeCheck.error },
        { status: activeCheck.status },
      )
    }

    if (!date || !symbol || !setupId) {
      return NextResponse.json(
        { error: 'تاریخ، نماد و ستاپ الزامی است' },
        { status: 400 },
      )
    }

    try {
      await assertActiveSymbol(symbol)
    } catch (e) {
      return NextResponse.json(
        { error: e.message || 'نماد نامعتبر است' },
        { status: 400 },
      )
    }

    const item = await MarketReality.create({
      userId,
      date: startOfLocalDay(date),
      symbol: String(symbol).trim().toUpperCase(),
      timeframe: timeframe || 'M15',
      setupId,
      tpCount: Math.max(0, Number(tpCount) || 0),
      slCount: Math.max(0, Number(slCount) || 0),
      notes: notes || '',
    })

    const populated = await MarketReality.findById(item._id)
      .populate('setupId', 'title type')
      .lean()

    return NextResponse.json({ success: true, marketReality: populated })
  } catch (error) {
    console.error('Create MarketReality Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
