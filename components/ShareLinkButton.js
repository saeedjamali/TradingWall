'use client'

import { useEffect, useRef, useState } from 'react'

function shareText({ title, text, url }) {
  return [title, text && text !== title ? text : '', url].filter(Boolean).join('\n\n')
}

export default function ShareLinkButton({
  title,
  text,
  url,
  path,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const boxRef = useRef(null)

  const href = () => {
    if (url) return url
    if (typeof window === 'undefined') return path || ''
    const suffix = path?.startsWith('/') ? path : `/${path || ''}`
    return `${window.location.origin}${suffix}`
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const copyForBale = async () => {
    const value = shareText({ title, text, url: href() })
    await navigator.clipboard.writeText(value)
    setCopied('bale')
    setTimeout(() => setCopied(''), 2000)
  }

  const shareTelegram = () => {
    const link = href()
    const telegram = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}`
    window.open(telegram, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const shareNative = async () => {
    const link = href()
    const body = shareText({ title, text, url: link })
    try {
      if (navigator.share) {
        // Bale often ignores title/url and only keeps a raw URL.
        // Put the whole card into text so the pasted message is not bare.
        await navigator.share({ title, text: body })
        return
      }
      await navigator.clipboard.writeText(body)
      setCopied('copy')
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // cancelled
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white"
      >
        اشتراک‌گذاری
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 p-1 text-right shadow-xl">
          <button
            type="button"
            onClick={shareTelegram}
            className="block w-full rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/10"
          >
            تلگرام — کارت لینک
          </button>
          <button
            type="button"
            onClick={copyForBale}
            className="block w-full rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/10"
          >
            {copied === 'bale' ? 'عنوان و لینک کپی شد' : 'بله — کپی عنوان + لینک'}
          </button>
          <button
            type="button"
            onClick={shareNative}
            className="block w-full rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/10"
          >
            {copied === 'copy' ? 'کپی شد' : 'سایر برنامه‌ها'}
          </button>
        </div>
      )}
    </div>
  )
}
