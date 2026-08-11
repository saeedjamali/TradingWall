'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_LABELS } from '@/utils/symbolSeed'

/**
 * Searchable symbol picker grouped by category
 */
export default function SymbolSelect({ value, onChange, required = false, disabled = false }) {
  const [symbols, setSymbols] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/symbols')
        const data = await res.json()
        if (!cancelled && data.success) setSymbols(data.symbols || [])
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = useMemo(
    () => symbols.find((s) => s.code === (value || '').toUpperCase()),
    [symbols, value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return symbols
    return symbols.filter((s) => {
      const hay = `${s.code} ${s.name} ${s.nameFa || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [symbols, query])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((s) => {
      if (!map[s.category]) map[s.category] = []
      map[s.category].push(s)
    })
    return map
  }, [filtered])

  const handlePick = (code) => {
    onChange?.(code)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-2 border rounded-lg text-right flex items-center justify-between gap-2 transition-colors ${
          disabled || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-300 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
        }`}
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {loading
            ? 'در حال بارگذاری نمادها...'
            : selected
              ? `${selected.code}${selected.nameFa ? ` — ${selected.nameFa}` : ` — ${selected.name}`}`
              : value
                ? value
                : 'انتخاب نماد...'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden input for native form required validation */}
      {required && (
        <input
          tabIndex={-1}
          className="sr-only"
          value={value || ''}
          required
          onChange={() => {}}
        />
      )}

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو: US30، طلا، BTC..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">نمادی یافت نشد</p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 border-b border-gray-100">
                    {CATEGORY_LABELS[category] || category}
                  </div>
                  {items.map((s) => (
                    <button
                      key={s._id || s.code}
                      type="button"
                      onClick={() => handlePick(s.code)}
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-primary-50 flex items-center justify-between gap-2 ${
                        value?.toUpperCase() === s.code ? 'bg-primary-50 text-primary-800' : 'text-gray-800'
                      }`}
                    >
                      <span className="font-mono font-semibold" dir="ltr">{s.code}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {s.nameFa || s.name}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
