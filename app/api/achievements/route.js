import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Achievement from '@/models/Achievement'

/** GET /api/achievements?userId= */
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 })
    }

    const achievements = await Achievement.find({ userId })
      .sort({ 'period.year': -1, 'period.month': -1, 'period.week': -1, rank: 1 })
      .lean()

    return NextResponse.json({ success: true, achievements })
  } catch (error) {
    console.error('Achievements GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
