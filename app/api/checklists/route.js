import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Checklist from '@/models/Checklist'

// GET: Fetch user's checklists
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const checklists = await Checklist.find({ userId }).sort({ order: 1 })

    return NextResponse.json({
      success: true,
      checklists,
    })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// POST: Create new checklist
export async function POST(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, title, items } = body
    
    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'userId and title are required' },
        { status: 400 }
      )
    }

    const checklist = await Checklist.create({
      userId,
      title,
      items: items || [],
    })

    return NextResponse.json({
      success: true,
      message: 'چک‌لیست با موفقیت ایجاد شد',
      checklist,
    })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
