'use client'

import { useState } from 'react'

export default function ShareLinkButton({
  title,
  text,
  path,
  className = '',
}) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
        : path
    const payload = { title, text: text || title, url }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload)
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${title}\n${url}`)
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
      {copied ? 'لینک کپی شد' : 'اشتراک‌گذاری'}
    </button>
  )
}
