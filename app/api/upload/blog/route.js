import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { ensureUploadDir, publicUploadUrl } from '@/utils/uploads'
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_LABEL,
  VIDEO_MIME_TYPES,
} from '@/utils/uploadLimits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') || formData.get('image') || formData.get('video')

    if (!file) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده است' }, { status: 400 })
    }

    const isImage = IMAGE_MIME_TYPES.includes(file.type) || file.type?.startsWith?.('image/')
    const isVideo = VIDEO_MIME_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'فرمت مجاز: تصویر (jpg, png, webp) یا ویدیو (mp4, webm)' },
        { status: 400 },
      )
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `حجم تصویر نباید بیشتر از ${MAX_IMAGE_LABEL} باشد` },
        { status: 400 },
      )
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: `حجم ویدیو نباید بیشتر از ${MAX_VIDEO_LABEL} باشد` },
        { status: 400 },
      )
    }

    const { dir, subDir } = await ensureUploadDir('blog')
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase()
    const safeExt = isVideo
      ? (['mp4', 'webm'].includes(extension) ? extension : 'mp4')
      : (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? extension : 'jpg')
    const filename = `blog_${timestamp}_${randomString}.${safeExt}`
    const filepath = path.join(dir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    return NextResponse.json({
      success: true,
      kind: isVideo ? 'video' : 'image',
      url: publicUploadUrl(subDir, filename),
    })
  } catch (error) {
    console.error('Blog media upload error:', error)
    return NextResponse.json({ error: 'خطا در آپلود فایل' }, { status: 500 })
  }
}
