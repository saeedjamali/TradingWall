import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Backtest from '@/models/Backtest'
import Symbol from '@/models/Symbol'
import { assertActiveSymbol } from '@/utils/symbolSeed'
import { requireActiveUser } from '@/utils/requireActiveUser'
import { computeBacktestPnL } from '@/utils/backtest'

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

    const backtests = await Backtest.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('setupIds')
      .lean()

    return NextResponse.json({ success: true, backtests })
  } catch (error) {
    console.error('Get Backtests Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
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

    if (!fields.date || !fields.symbol || !fields.direction) {
      return NextResponse.json(
        { error: 'تاریخ، نماد و جهت معامله الزامی است' },
        { status: 400 },
      )
    }

    const symbolCheck = await assertActiveSymbol(Symbol, fields.symbol)
    if (!symbolCheck.ok) {
      return NextResponse.json({ error: symbolCheck.error }, { status: 400 })
    }

    const slHits = Math.max(0, parseInt(fields.slHits, 10) || 0)
    const tpHits = Math.max(0, parseInt(fields.tpHits, 10) || 0)
    const risk =
      fields.risk === '' || fields.risk === null || fields.risk === undefined
        ? null
        : Number(fields.risk)

    const backtest = await Backtest.create({
      userId,
      date: new Date(fields.date),
      symbol: symbolCheck.code,
      timeframe: fields.timeframe || 'M15',
      direction: fields.direction,
      session: fields.session || 'other',
      setupIds: fields.setupIds || [],
      marketCondition: fields.marketCondition || '',
      entryReason: fields.entryReason || '',
      entry: fields.entry !== '' && fields.entry != null ? Number(fields.entry) : null,
      sl: fields.sl !== '' && fields.sl != null ? Number(fields.sl) : null,
      tp: fields.tp !== '' && fields.tp != null ? Number(fields.tp) : null,
      risk: risk !== null && !Number.isNaN(risk) ? risk : null,
      rr: fields.rr !== '' && fields.rr != null ? Number(fields.rr) : null,
      slHits,
      tpHits,
      resultPnL: computeBacktestPnL(tpHits, slHits, risk),
      weaknesses: fields.weaknesses || '',
      strengths: fields.strengths || '',
      lesson: fields.lesson || '',
      notes: fields.notes || '',
      tradeImage: fields.tradeImage || null,
    })

    const populated = await Backtest.findById(backtest._id).populate('setupIds')

    return NextResponse.json({
      success: true,
      message: 'بک‌تست ذخیره شد',
      backtest: populated,
    })
  } catch (error) {
    console.error('Create Backtest Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
