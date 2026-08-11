import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { archiveEndedPeriods, archivePeriod, getPreviousPeriodDate } from '@/utils/leaderboard'

/**
 * POST /api/leaderboards/archive
 * Force-archive previous periods (for cron / manual)
 * Body optional: { metric, periodType, date }
 */
export async function POST(request) {
  try {
    await connectDB()

    let body = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    if (body.metric && body.periodType) {
      const date = body.date ? new Date(body.date) : getPreviousPeriodDate(body.periodType)
      const result = await archivePeriod(body.metric, body.periodType, date)
      return NextResponse.json({ success: true, result })
    }

    const results = await archiveEndedPeriods(new Date())
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Leaderboards Archive Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
