import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Setup from '@/models/Setup'

// PUT - Update custom setup
export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    const { userId, title, description } = body
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Find setup and verify it's a custom setup belonging to this user
    const setup = await Setup.findById(id)
    
    if (!setup) {
      return NextResponse.json(
        { success: false, error: 'ستاپ یافت نشد' },
        { status: 404 }
      )
    }

    if (setup.type === 'standard') {
      return NextResponse.json(
        { success: false, error: 'امکان ویرایش ستاپ استاندارد وجود ندارد' },
        { status: 403 }
      )
    }

    if (setup.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما مجاز به ویرایش این ستاپ نیستید' },
        { status: 403 }
      )
    }

    // Update setup
    setup.title = title || setup.title
    setup.description = description !== undefined ? description : setup.description
    await setup.save()

    return NextResponse.json({
      success: true,
      message: 'ستاپ با موفقیت به‌روزرسانی شد',
      setup,
    })
  } catch (error) {
    console.error('Error updating setup:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// DELETE - Delete custom setup
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

    // Find setup and verify it's a custom setup belonging to this user
    const setup = await Setup.findById(id)
    
    if (!setup) {
      return NextResponse.json(
        { success: false, error: 'ستاپ یافت نشد' },
        { status: 404 }
      )
    }

    if (setup.type === 'standard') {
      return NextResponse.json(
        { success: false, error: 'امکان حذف ستاپ استاندارد وجود ندارد' },
        { status: 403 }
      )
    }

    if (setup.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما مجاز به حذف این ستاپ نیستید' },
        { status: 403 }
      )
    }

    await Setup.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'ستاپ با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting setup:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
