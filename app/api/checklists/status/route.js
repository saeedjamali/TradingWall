import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChecklistStatus from '@/models/ChecklistStatus'

// GET: Fetch checklist status for today
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateStr = searchParams.get('date')
    
    if (!userId || !dateStr) {
      return NextResponse.json(
        { success: false, error: 'userId and date are required' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    let status = await ChecklistStatus.findOne({ userId, date })

    if (!status) {
      status = await ChecklistStatus.create({
        userId,
        date,
        checkedItems: [],
      })
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error('Error fetching checklist status:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// POST: Toggle checklist item
export async function POST(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, date, checklistId, itemIndex } = body
    
    if (!userId || !date || !checklistId || itemIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    let status = await ChecklistStatus.findOne({ userId, date: dateObj })

    if (!status) {
      status = await ChecklistStatus.create({
        userId,
        date: dateObj,
        checkedItems: [{ checklistId, itemIndex }],
      })
    } else {
      // Toggle: remove if exists, add if doesn't
      const existingIndex = status.checkedItems.findIndex(
        item => item.checklistId.toString() === checklistId && item.itemIndex === itemIndex
      )

      if (existingIndex >= 0) {
        status.checkedItems.splice(existingIndex, 1)
      } else {
        status.checkedItems.push({ checklistId, itemIndex })
      }

      await status.save()
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error('Error toggling checklist item:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// DELETE: Reset all checklist items for a date
export async function DELETE(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateStr = searchParams.get('date')
    
    if (!userId || !dateStr) {
      return NextResponse.json(
        { success: false, error: 'userId and date are required' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    let status = await ChecklistStatus.findOne({ userId, date })

    if (!status) {
      status = await ChecklistStatus.create({
        userId,
        date,
        checkedItems: [],
      })
    } else {
      status.checkedItems = []
      await status.save()
    }

    return NextResponse.json({
      success: true,
      message: 'چک‌لیست ریست شد',
      status,
    })
  } catch (error) {
    console.error('Error resetting checklist:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
