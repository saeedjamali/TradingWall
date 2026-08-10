import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    await connectDB()
    
    const { phone, password } = await request.json()
    
    // Validate input
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'شماره تلفن و رمز عبور الزامی است' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await User.findOne({ phone })
    
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // Check if user has password set
    if (!user.password) {
      return NextResponse.json(
        { error: 'این کاربر رمز عبور تنظیم نکرده است. لطفاً از طریق OTP وارد شوید' },
        { status: 400 }
      )
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
    }
    
    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      phone: user.phone,
      publicName: user.publicName,
      role: user.role,
      verified: user.verified,
    }
    
    return NextResponse.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      user: userData,
    })
    
  } catch (error) {
    console.error('Login Password Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
