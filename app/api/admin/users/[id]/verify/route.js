import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const { verified } = await request.json()
    
    const user = await User.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: verified ? 'کاربر تایید شد' : 'تایید کاربر لغو شد',
      user,
    })
    
  } catch (error) {
    console.error('Verify User Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
