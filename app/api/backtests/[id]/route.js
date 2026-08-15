import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Backtest from '@/models/Backtest'
import Symbol from '@/models/Symbol'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { computeBacktestPnL } from '@/utils/backtest'

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const { userId, ...fields } = body

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

    const backtest = await Backtest.findOne({ _id: id, userId })
    if (!backtest) {
      return NextResponse.json({ error: 'بک‌تست یافت نشد' }, { status: 404 })
    }

    if (fields.symbol) {
      const symbolCheck = await assertActiveSymbol(Symbol, fields.symbol)
      if (!symbolCheck.ok) {
        return NextResponse.json({ error: symbolCheck.error }, { status: 400 })
      }
      fields.symbol = symbolCheck.code
    }

    if (fields.date) fields.date = new Date(fields.date)

    const slHits =
      fields.slHits !== undefined
        ? Math.max(0, parseInt(fields.slHits, 10) || 0)
        : backtest.slHits
    const tpHits =
      fields.tpHits !== undefined
        ? Math.max(0, parseInt(fields.tpHits, 10) || 0)
        : backtest.tpHits
    let risk = backtest.risk
    if (fields.risk !== undefined) {
      risk =
        fields.risk === '' || fields.risk === null
          ? null
          : Number(fields.risk)
      if (risk !== null && Number.isNaN(risk)) risk = null
    }

    Object.assign(backtest, {
      ...fields,
      slHits,
      tpHits,
      risk,
      resultPnL: computeBacktestPnL(tpHits, slHits, risk),
    })

    await backtest.save()
    const populated = await Backtest.findById(backtest._id).populate('setupIds')

    return NextResponse.json({
      success: true,
      message: 'بک‌تست به‌روزرسانی شد',
      backtest: populated,
    })
  } catch (error) {
    console.error('Update Backtest Error:', error)
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

    const deleted = await Backtest.findOneAndDelete({ _id: id, userId })
    if (!deleted) {
      return NextResponse.json({ error: 'بک‌تست یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'بک‌تست حذف شد' })
  } catch (error) {
    console.error('Delete Backtest Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
