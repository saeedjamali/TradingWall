import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import OTP from '@/models/OTP'
import User from '@/models/User'
import { isOTPExpired } from '@/utils/generateOTP'

export async function POST(request) {
  try {
    await connectDB()
    
    const { phone, code } = await request.json()
    
    // Validate input
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'شماره موبایل و کد الزامی است' },
        { status: 400 }
      )
    }
    
    // Find OTP
    const otp = await OTP.findOne({
      phone,
      code,
      verified: false,
    }).sort({ createdAt: -1 })
    
    if (!otp) {
      return NextResponse.json(
        { error: 'کد تایید نامعتبر است' },
        { status: 400 }
      )
    }
    
    // Check expiration
    if (isOTPExpired(otp.expiresAt)) {
      return NextResponse.json(
        { error: 'کد تایید منقضی شده است' },
        { status: 400 }
      )
    }
    
    // Mark OTP as verified
    otp.verified = true
    await otp.save()
    
    // Find or create user
    let user = await User.findOne({ phone })
    
    if (!user) {
      user = await User.create({
        phone,
        publicName: `کاربر ${phone.slice(-4)}`,
      })
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'حساب کاربری شما غیرفعال شده است. با پشتیبانی تماس بگیرید' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      user: {
        id: user._id.toString(),
        phone: user.phone,
        publicName: user.publicName,
        role: user.role,
        verified: user.verified,
      },
    })
    
  } catch (error) {
    console.error('Verify OTP Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
