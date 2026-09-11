'use client'

import { useEffect, useState } from 'react'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function FooterBackToTop({ className = '' }) {
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-primary-300 transition-colors ${className}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
      رفتن به بالا
    </button>
  )
}

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="رفتن به بالا"
      className={`fixed z-40 bottom-5 end-4 sm:bottom-6 sm:end-6 print:hidden inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-black/30 ring-1 ring-white/15 transition-all hover:bg-primary-500 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'pointer-events-none opacity-0 translate-y-2'
      }`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.25}
          d="M5 15l7-7 7 7"
        />
      </svg>
      <span className="hidden sm:inline">رفتن به بالا</span>
    </button>
  )
}
