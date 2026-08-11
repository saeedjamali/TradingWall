import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import {
  getAllLiveBoards,
  getHistoryBoards,
  archiveEndedPeriods,
  METRICS,
  PERIOD_TYPES,
} from '@/utils/leaderboard'
import { listWeeksInMonth } from '@/utils/periods'

/**
 * GET /api/leaderboards?view=current|history
 * History filters: metric, periodType, year, month, weekOfMonth|week, limit
 */
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'current'
    const metric = searchParams.get('metric')
    const periodType = searchParams.get('periodType')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const weekOfMonth = searchParams.get('weekOfMonth')
    const week = searchParams.get('week')
    const limit = parseInt(searchParams.get('limit') || '24')

    try {
      await archiveEndedPeriods(new Date())
    } catch (err) {
      console.error('Lazy archive error:', err)
    }

    if (view === 'history') {
      if (metric && !METRICS.includes(metric)) {
        return NextResponse.json({ error: 'metric نامعتبر' }, { status: 400 })
      }
      if (periodType && !PERIOD_TYPES.includes(periodType)) {
        return NextResponse.json({ error: 'periodType نامعتبر' }, { status: 400 })
      }

      const filters = {
        metric: metric || undefined,
        periodType: periodType || undefined,
        year: year || undefined,
        month: month || undefined,
        week: week || undefined,
        limit,
      }

      let weeksMeta = null

      if (periodType === 'week' && year && month) {
        weeksMeta = listWeeksInMonth(year, month)

        if (weekOfMonth && weekOfMonth !== 'all') {
          const target = weeksMeta[Number(weekOfMonth) - 1]
          if (!target) {
            return NextResponse.json({
              success: true,
              view: 'history',
              snapshots: [],
              weeks: weeksMeta,
              filters: { metric, periodType, year, month, weekOfMonth },
            })
          }
          // periodKey uniquely identifies the week (works even if month was null on old docs)
          filters.periodKey = target.periodKey
          filters.year = undefined
          filters.month = undefined
          filters.week = undefined
        } else {
          const keys = weeksMeta.map((w) => w.periodKey)
          if (keys.length === 0) {
            return NextResponse.json({
              success: true,
              view: 'history',
              snapshots: [],
              weeks: weeksMeta,
              filters: { metric, periodType, year, month, weekOfMonth: 'all' },
            })
          }
          filters.periodKeys = keys
          filters.year = undefined
          filters.month = undefined
          filters.week = undefined
        }
      }

      const snapshots = await getHistoryBoards(filters)
      return NextResponse.json({
        success: true,
        view: 'history',
        snapshots,
        weeks: weeksMeta,
        filters: { metric, periodType, year, month, week, weekOfMonth },
      })
    }

    const boards = await getAllLiveBoards(new Date())
    return NextResponse.json({
      success: true,
      view: 'current',
      boards,
      minTrades: { week: 5, month: 20, year: 220 },
    })
  } catch (error) {
    console.error('Leaderboards GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
