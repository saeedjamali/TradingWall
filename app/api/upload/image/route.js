import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') || formData.get('file')
    const type = formData.get('type') || 'profile' // 'profile' or 'plan'
    
    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل باید عکس باشد (jpg, png, gif, webp)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' },
        { status: 400 }
      )
    }

    // Create uploads directory based on type
    const subDir = type === 'profile' ? 'profiles' : 'plans'
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const filename = `${type}_${timestamp}_${randomString}.${extension}`
    
    const filepath = path.join(uploadsDir, filename)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)
    
    // Return the public URL
    const publicUrl = `/uploads/${subDir}/${filename}`
    
    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت آپلود شد',
      url: publicUrl,
    })
    
  } catch (error) {
    console.error('Upload Image Error:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}
