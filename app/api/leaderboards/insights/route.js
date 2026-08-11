import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getInsightsReport } from '@/utils/insights'

/**
 * GET /api/leaderboards/insights
 * Geo + setup performance report (24h cache)
 */
export async function GET() {
  try {
    await connectDB()
    const report = await getInsightsReport(new Date())
    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Leaderboard Insights Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
