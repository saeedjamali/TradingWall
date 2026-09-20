import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import {
  getActiveBlogCategories,
  getActiveFeedbackCategories,
} from '@/utils/siteSettings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const [blogCategories, feedbackCategories] = await Promise.all([
      getActiveBlogCategories(),
      getActiveFeedbackCategories(),
    ])
    return NextResponse.json({
      success: true,
      blogCategories,
      feedbackCategories,
    })
  } catch (error) {
    console.error('Site config GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
