import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { ensureUploadDir, publicUploadUrl } from '@/utils/uploads'
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
} from '@/utils/uploadLimits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') || formData.get('file')
    const type = formData.get('type') || 'profile' // profile | plan | message

    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      )
    }

    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل باید عکس باشد (jpg, png, gif, webp)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `حجم فایل نباید بیشتر از ${MAX_IMAGE_LABEL} باشد` },
        { status: 400 }
      )
    }

    const { dir, subDir } = await ensureUploadDir(type)

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
      ? extension
      : 'jpg'
    const filename = `${type}_${timestamp}_${randomString}.${safeExt}`
    const filepath = path.join(dir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت آپلود شد',
      url: publicUploadUrl(subDir, filename),
    })
  } catch (error) {
    console.error('Upload Image Error:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}
