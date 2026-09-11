/** Shared upload limits (safe for client + server) */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // 3MB
export const MAX_IMAGE_MB = 3
export const MAX_IMAGE_LABEL = `${MAX_IMAGE_MB} مگابایت`

export const MAX_VIDEO_BYTES = 40 * 1024 * 1024
export const MAX_VIDEO_LABEL = '۴۰ مگابایت'
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm']

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

export function validateImageFile(file) {
  if (!file) {
    return { ok: false, error: 'فایلی انتخاب نشده است' }
  }
  if (!IMAGE_MIME_TYPES.includes(file.type) && !file.type?.startsWith?.('image/')) {
    return { ok: false, error: 'فرمت فایل باید عکس باشد (jpg, png, gif, webp)' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `حجم فایل نباید بیشتر از ${MAX_IMAGE_LABEL} باشد`,
    }
  }
  return { ok: true }
}
