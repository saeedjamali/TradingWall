'use client'

import { useState } from 'react'

export default function ShareLinkButton({
  title,
  text,
  url,
  path,
  className = '',
}) {
  const [copied, setCopied] = useState(false)

  const shareUrl = () => {
    if (url) return url
    if (typeof window === 'undefined') return path || ''
    const suffix = path?.startsWith('/') ? path : `/${path || ''}`
    return `${window.location.origin}${suffix}`
  }

  const share = async () => {
    const href = shareUrl()
    const payload = { title, text: text || title, url: href }
    const clipboard = [title, text && text !== title ? text : '', href]
      .filter(Boolean)
      .join('\n')

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload)
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(clipboard)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // user cancelled share sheet
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white ${className}`}
    >
      {copied ? 'عنوان و لینک کپی شد' : 'اشتراک‌گذاری'}
    </button>
  )
}
