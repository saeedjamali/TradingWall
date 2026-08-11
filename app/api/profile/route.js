import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// GET: Get user profile
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر مشخص نشده است' },
        { status: 400 }
      )
    }
    
    const user = await User.findById(userId).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user,
    })
    
  } catch (error) {
    console.error('Get Profile Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// PUT: Update profile
export async function PUT(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, ...updateData } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }
    
    // Don't allow updating sensitive fields
    delete updateData.phone
    delete updateData.role
    delete updateData.verified
    
    // Hash password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
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
      message: 'پروفایل با موفقیت به‌روز شد',
      user: {
        id: user._id.toString(),
        phone: user.phone,
        publicName: user.publicName,
        role: user.role,
        verified: user.verified,
        profileImage: user.profileImage,
        province: user.province,
        city: user.city,
        privacySettings: user.privacySettings,
      },
    })
    
  } catch (error) {
    console.error('Update Profile Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
