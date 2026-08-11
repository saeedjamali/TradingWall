import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import OTP from '@/models/OTP'
import User from '@/models/User'
import { generateOTP, getOTPExpiryTime } from '@/utils/generateOTP'
import { sendOTP } from '@/utils/smsir'

export async function POST(request) {
  try {
    await connectDB()
    
    const { phone } = await request.json()
    
    // Validate phone number
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }

    const existingUser = await User.findOne({ phone }).select('isActive')
    if (existingUser && existingUser.isActive === false) {
      return NextResponse.json(
        { error: 'حساب کاربری شما غیرفعال شده است. با پشتیبانی تماس بگیرید' },
        { status: 403 }
      )
    }
    
    // Check for recent OTP request (rate limiting)
    const recentOTP = await OTP.findOne({
      phone,
      createdAt: { $gte: new Date(Date.now() - 120000) } // Last 2 minutes
    })
    
    if (recentOTP) {
      return NextResponse.json(
        { error: 'لطفاً ۲ دقیقه صبر کنید' },
        { status: 429 }
      )
    }
    
    // Generate OTP code
    const code = generateOTP(5)
    const expiresAt = getOTPExpiryTime(10) // 10 minutes
    
    // Save OTP to database
    await OTP.create({
      phone,
      code,
      expiresAt,
    })
    
    // For development: log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📱 OTP Code for Testing:')
      console.log('Phone:', phone)
      console.log('Code:', code)
      console.log('Expires:', expiresAt)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
    
    // Send SMS
    const smsResult = await sendOTP(phone, code)
    
    if (!smsResult.success) {
      console.error('SMS Error:', smsResult.error)
      // در حالت development، حتی اگر SMS ارسال نشد، موفق بازگرد
      // تا بتوان با کد از console تست کرد
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'کد تایید در Console نمایش داده شد (SMS ارسال نشد)',
          expiresAt,
          devMode: true,
        })
      }
      
      return NextResponse.json(
        { error: smsResult.error || 'خطا در ارسال پیامک' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'کد تایید ارسال شد',
      expiresAt,
    })
    
  } catch (error) {
    console.error('Send OTP Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
