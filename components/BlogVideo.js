'use client'

import { parseVideoEmbed } from '@/utils/blog'

export default function BlogVideo({ url, file }) {
  const embed = parseVideoEmbed(file || url)
  if (!embed) return null

  if (embed.type === 'file') {
    return (
      <video
        className="w-full rounded-2xl bg-black aspect-video"
        src={embed.src}
        controls
        preload="metadata"
      >
        مرورگر شما پخش ویدیو را پشتیبانی نمی‌کند.
      </video>
    )
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        src={embed.src}
        title="ویدیو مقاله"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
