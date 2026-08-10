import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import Setup from '@/models/Setup'

// PUT: Update plan
export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    // Clean up body - remove undefined/null setupId
    const cleanBody = { ...body }
    if (!cleanBody.setupId) {
      delete cleanBody.setupId
    }
    
    const plan = await Plan.findByIdAndUpdate(
      id,
      { ...cleanBody, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
    
    if (!plan) {
      return NextResponse.json(
        { error: 'پلن پیدا نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'پلن با موفقیت به‌روزرسانی شد',
      plan,
    })
    
  } catch (error) {
    console.error('Update Plan Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// DELETE: Delete plan
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    
    const plan = await Plan.findByIdAndDelete(id)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'پلن پیدا نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'پلن با موفقیت حذف شد',
    })
    
  } catch (error) {
    console.error('Delete Plan Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
