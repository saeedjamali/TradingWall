import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Setup from '@/models/Setup'

// GET - Fetch setups (standard + user's custom)
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const standardOnly = searchParams.get('standard') === '1'

    if (standardOnly) {
      const setups = await Setup.find({ type: 'standard' })
        .select('_id title type description')
        .sort({ title: 1 })
        .lean()
      return NextResponse.json({ success: true, setups })
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Fetch standard setups + user's custom setups
    const setups = await Setup.find({
      $or: [
        { type: 'standard' },
        { type: 'custom', userId }
      ]
    }).sort({ type: 1, title: 1 })

    return NextResponse.json({
      success: true,
      setups,
    })
  } catch (error) {
    console.error('Error fetching setups:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// POST - Create custom setup
export async function POST(request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { userId, title, description } = body
    
    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'userId and title are required' },
        { status: 400 }
      )
    }

    const setup = await Setup.create({
      title,
      description: description || '',
      type: 'custom',
      userId,
    })

    return NextResponse.json({
      success: true,
      message: 'ستاپ با موفقیت ایجاد شد',
      setup,
    })
  } catch (error) {
    console.error('Error creating setup:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
