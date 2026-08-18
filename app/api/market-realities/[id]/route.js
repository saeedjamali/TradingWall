import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MarketReality from '@/models/MarketReality'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { startOfLocalDay } from '@/utils/backtest'

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
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

    const existing = await MarketReality.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 })
    }
    if (String(existing.userId) !== String(userId)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    if (symbol) {
      try {
        await assertActiveSymbol(symbol)
      } catch (e) {
        return NextResponse.json(
          { error: e.message || 'نماد نامعتبر است' },
          { status: 400 },
        )
      }
    }

    if (date) existing.date = startOfLocalDay(date)
    if (symbol) existing.symbol = String(symbol).trim().toUpperCase()
    if (timeframe) existing.timeframe = timeframe
    if (setupId) existing.setupId = setupId
    if (tpCount !== undefined) existing.tpCount = Math.max(0, Number(tpCount) || 0)
    if (slCount !== undefined) existing.slCount = Math.max(0, Number(slCount) || 0)
    if (notes !== undefined) existing.notes = notes || ''

    await existing.save()

    const populated = await MarketReality.findById(id)
      .populate('setupId', 'title type')
      .lean()

    return NextResponse.json({ success: true, marketReality: populated })
  } catch (error) {
    console.error('Update MarketReality Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    const existing = await MarketReality.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 })
    }
    if (String(existing.userId) !== String(userId)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    await MarketReality.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete MarketReality Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
