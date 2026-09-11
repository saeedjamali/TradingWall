'use client'

import { useEffect, useState } from 'react'
import { applyTheme, readTheme, THEME_EVENT } from '@/utils/theme'

export default function ThemeToggle({ className = '', onLight = false }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const sync = () => setTheme(readTheme())
    sync()
    window.addEventListener(THEME_EVENT, sync)
    return () => window.removeEventListener(THEME_EVENT, sync)
  }, [])

  const isLight = theme === 'light'
  const label = isLight ? 'تغییر به حالت تیره' : 'تغییر به حالت روشن'
  const tone = onLight
    ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    : 'border-white/15 text-white/75 hover:bg-white/10 hover:text-white'

  return (
    <button
      type="button"
      className={`theme-toggle inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${tone} ${className}`}
      title={label}
      aria-label={label}
      onClick={() => applyTheme(isLight ? 'dark' : 'light')}
    >
      {isLight ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  )
}
