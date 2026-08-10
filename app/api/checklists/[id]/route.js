import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Checklist from '@/models/Checklist'

// PUT - Update checklist
export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    const { userId, title, items } = body
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Find checklist and verify ownership
    const checklist = await Checklist.findById(id)
    
    if (!checklist) {
      return NextResponse.json(
        { success: false, error: 'چک‌لیست یافت نشد' },
        { status: 404 }
      )
    }

    if (checklist.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما مجاز به ویرایش این چک‌لیست نیستید' },
        { status: 403 }
      )
    }

    // Update checklist
    checklist.title = title || checklist.title
    checklist.items = items !== undefined ? items : checklist.items
    await checklist.save()

    return NextResponse.json({
      success: true,
      message: 'چک‌لیست با موفقیت به‌روزرسانی شد',
      checklist,
    })
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// DELETE - Delete checklist
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Find checklist and verify ownership
    const checklist = await Checklist.findById(id)
    
    if (!checklist) {
      return NextResponse.json(
        { success: false, error: 'چک‌لیست یافت نشد' },
        { status: 404 }
      )
    }

    if (checklist.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما مجاز به حذف این چک‌لیست نیستید' },
        { status: 403 }
      )
    }

    await Checklist.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'چک‌لیست با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting checklist:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
