import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'

const ACTIVITY_TYPES = ['book', 'video', 'course', 'article', 'practice', 'other']

/** GET /api/activities?userId= */
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 })
    }

    const activities = await Activity.find({ userId }).sort({ date: -1 }).lean()
    return NextResponse.json({ success: true, activities })
  } catch (error) {
    console.error('Activities GET Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** POST /api/activities */
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { userId, title, description, type, image, link, date } = body

    if (!userId || !title?.trim()) {
      return NextResponse.json({ error: 'عنوان و کاربر الزامی است' }, { status: 400 })
    }

    const activity = await Activity.create({
      userId,
      title: title.trim(),
      description: description || '',
      type: ACTIVITY_TYPES.includes(type) ? type : 'other',
      image: image || null,
      link: link || null,
      date: date ? new Date(date) : new Date(),
    })

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Activities POST Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** PUT /api/activities — body: { userId, activityId, ... } */
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { userId, activityId, title, description, type, image, link, date } = body

    if (!userId || !activityId) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    const update = {}
    if (title != null) update.title = title.trim()
    if (description != null) update.description = description
    if (type != null && ACTIVITY_TYPES.includes(type)) update.type = type
    if (image !== undefined) update.image = image
    if (link !== undefined) update.link = link
    if (date) update.date = new Date(date)

    const activity = await Activity.findOneAndUpdate(
      { _id: activityId, userId },
      update,
      { new: true }
    )

    if (!activity) {
      return NextResponse.json({ error: 'فعالیت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Activities PUT Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** DELETE /api/activities?userId=&activityId= */
export async function DELETE(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const activityId = searchParams.get('activityId')

    if (!userId || !activityId) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    const deleted = await Activity.findOneAndDelete({ _id: activityId, userId })
    if (!deleted) {
      return NextResponse.json({ error: 'فعالیت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activities DELETE Error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
