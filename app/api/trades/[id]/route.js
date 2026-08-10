import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/models/Trade'

// GET: Fetch single trade
export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    // Find trade and verify ownership
    const trade = await Trade.findOne({ _id: id, userId }).populate('setupIds')
    
    if (!trade) {
      return NextResponse.json(
        { error: 'معامله یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      trade,
    })
    
  } catch (error) {
    console.error('Get Trade Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// PUT: Update trade
export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    const { userId, ...updateData } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    // Find trade and verify ownership
    const trade = await Trade.findOne({ _id: id, userId })
    
    if (!trade) {
      return NextResponse.json(
        { error: 'معامله یافت نشد' },
        { status: 404 }
      )
    }
    
    // Update trade
    Object.assign(trade, updateData)
    await trade.save()
    
    return NextResponse.json({
      success: true,
      message: 'معامله با موفقیت به‌روز شد',
      trade,
    })
    
  } catch (error) {
    console.error('Update Trade Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// DELETE: Delete trade
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    // Find and delete trade
    const trade = await Trade.findOneAndDelete({ _id: id, userId })
    
    if (!trade) {
      return NextResponse.json(
        { error: 'معامله یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'معامله با موفقیت حذف شد',
    })
    
  } catch (error) {
    console.error('Delete Trade Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
