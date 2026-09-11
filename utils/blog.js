export const BLOG_CATEGORY_LABELS = {
  journal: 'ژورنال معاملاتی',
  backtest: 'بک‌تست',
  psychology: 'روانشناسی معامله',
  education: 'آموزش فارکس',
  tools: 'ابزار معامله',
  market: 'بازار و تحلیل',
}

export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
}

export function publicPostFilter(now = new Date()) {
  return {
    isActive: true,
    isVisible: true,
    publishedAt: { $lte: now },
  }
}

export function isPublicPost(post, now = new Date()) {
  if (!post) return false
  if (!post.isActive) return false
  if (!post.publishedAt || new Date(post.publishedAt) > now) return false
  return true
}

export function readingMinutes(body = '') {
  const text = String(body).replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 180))
}

export function splitCsv(value) {
  return String(value || '')
    .split(/[،,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20)
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderBlogHtml(raw) {
  const escaped = escapeHtml(raw).replace(/\r\n/g, '\n')
  const withMedia = escaped
    .replace(
      /!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g,
      '<img src="$2" alt="$1" class="rounded-xl my-5 w-full max-h-[520px] object-contain bg-slate-950/70 border border-white/10" />',
    )
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" class="text-cyan-300 underline underline-offset-4 hover:text-cyan-200" rel="noopener noreferrer" target="_blank">$1</a>',
    )
    .replace(
      /\[([^\]]+)\]\((\/[^)\s]*)\)/g,
      '<a href="$2" class="text-emerald-300 underline underline-offset-4 hover:text-emerald-200">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="blog-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="blog-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h2 class="blog-h2">$1</h2>')

  return withMedia
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<h') || trimmed.startsWith('<img')) return trimmed

      const lines = trimmed.split('\n').filter((line) => line.trim())
      if (lines.length && lines.every((line) => /^&gt;\s?/.test(line))) {
        const text = lines.map((line) => line.replace(/^&gt;\s?/, '')).join('<br/>')
        return `<aside class="blog-callout">${text}</aside>`
      }
      if (lines.length > 1 && lines.every((line) => /^\d+\.\s/.test(line))) {
        const items = lines
          .map((line) => `<li>${line.replace(/^\d+\.\s/, '')}</li>`)
          .join('')
        return `<ol class="blog-steps">${items}</ol>`
      }
      if (lines.length > 1 && lines.every((line) => /^[-*]\s/.test(line))) {
        const items = lines
          .map((line) => `<li>${line.replace(/^[-*]\s/, '')}</li>`)
          .join('')
        return `<ul class="blog-bullets">${items}</ul>`
      }
      return `<p class="blog-p">${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}

export function parseVideoEmbed(url) {
  const value = String(url || '').trim()
  if (!value) return null

  const yt =
    value.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i,
    )
  if (yt) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${yt[1]}`,
    }
  }

  const aparat = value.match(/aparat\.com\/(?:v\/|video\/video\/embed\/videohash\/)?([\w-]+)/i)
  if (aparat && !value.includes('/embed/')) {
    return {
      type: 'iframe',
      src: `https://www.aparat.com/video/video/embed/videohash/${aparat[1]}/vt/frame`,
    }
  }
  if (value.includes('aparat.com/video/video/embed')) {
    return { type: 'iframe', src: value }
  }

  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeo) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  }

  if (/\.(mp4|webm)(\?|$)/i.test(value) || value.startsWith('/uploads/')) {
    return { type: 'file', src: value }
  }

  return { type: 'iframe', src: value }
}

export function commentsNeedApproval(post) {
  if (!post) return true
  return post.commentsRequireApproval !== false
}

export function ratingAverage(sum, count) {
  if (!count) return 0
  return Math.round((Number(sum) / Number(count)) * 10) / 10
}
