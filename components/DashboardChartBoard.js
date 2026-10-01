'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tw_dashboard_chart_prefs'
const PREFS_VERSION = 2
const DEFAULT_PINNED = ['daily', 'yearly']

function LayerToggle({ active, onClick, activeClass, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
        active ? activeClass : 'bg-white/10 text-white/45'
      }`}
    >
      {children}
    </button>
  )
}

function ChartLayer({ label, tone, children }) {
  const cap = tone === 'cap'
  return (
    <div
      className={`h-auto min-w-0 self-start rounded-xl border-2 p-2 [&>*]:!h-auto ${
        cap
          ? 'border-amber-400 bg-amber-400/15'
          : 'border-sky-400 bg-sky-400/10'
      }`}
    >
      <div
        className={`mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
          cap ? 'bg-amber-400 text-slate-900' : 'bg-sky-500 text-white'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${cap ? 'bg-slate-900/70' : 'bg-white'}`} />
        {label}
      </div>
      {children}
    </div>
  )
}

function asIds(value) {
  return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
}

function readPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const pinned = asIds(raw.pinned)
    const open = asIds(raw.open)
    if (raw.v === PREFS_VERSION) return { pinned, open }
    const nextPinned = [...new Set([...DEFAULT_PINNED, ...pinned])]
    return {
      pinned: nextPinned,
      open: open.filter((id) => !nextPinned.includes(id)),
    }
  } catch {
    return { pinned: [...DEFAULT_PINNED], open: [] }
  }
}

export default function DashboardChartBoard({ items, compare = false, capLabel = '' }) {
  const [pinned, setPinned] = useState(DEFAULT_PINNED)
  const [open, setOpen] = useState([])
  const [recent, setRecent] = useState(DEFAULT_PINNED)
  const [ready, setReady] = useState(false)
  const [layers, setLayers] = useState({ actual: true, capped: true })

  useEffect(() => {
    if (compare) setLayers({ actual: true, capped: true })
  }, [compare])

  const toggleLayer = (key) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next.actual && !next.capped) return prev
      return next
    })
  }

  useEffect(() => {
    const saved = readPrefs()
    setPinned(saved.pinned)
    setOpen(saved.open)
    setRecent([...saved.pinned, ...saved.open])
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: PREFS_VERSION, pinned, open }))
    } catch {
      // ignore storage errors
    }
  }, [pinned, open, ready])

  const bringForward = (id) => {
    setRecent((prev) => [id, ...prev.filter((item) => item !== id)])
  }

  const toggleOpen = (id) => {
    if (pinned.includes(id)) {
      bringForward(id)
      return
    }
    setOpen((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      bringForward(id)
      return [...prev, id]
    })
  }

  const togglePin = (id) => {
    setPinned((prev) => {
      if (prev.includes(id)) {
        setOpen((current) => current.filter((item) => item !== id))
        return prev.filter((item) => item !== id)
      }
      bringForward(id)
      setOpen((current) => current.filter((item) => item !== id))
      return [...prev, id]
    })
  }

  const visibleIds = new Set([...pinned, ...open])
  const visible = [...items]
    .filter((item) => visibleIds.has(item.id))
    .sort((a, b) => {
      const ai = recent.indexOf(a.id)
      const bi = recent.indexOf(b.id)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

  return (
    <section className="mt-4 mb-8" dir="rtl">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">نمودارها</h2>
          <p className="text-xs text-white/60 mt-1">
            نوع نمودار را از فهرست راست انتخاب کنید؛ نمودار همان‌جا روبه‌رو باز می‌شود. «همیشه» آن را برای دفعه‌های بعد هم باز نگه می‌دارد.
          </p>
        </div>
        {compare && (
          <div className="flex items-center gap-1.5" role="group" aria-label="نمایش نمودار واقعی و سقف">
            <LayerToggle
              active={layers.actual}
              onClick={() => toggleLayer('actual')}
              activeClass="bg-white text-slate-800"
            >
              واقعی
            </LayerToggle>
            <LayerToggle
              active={layers.capped}
              onClick={() => toggleLayer('capped')}
              activeClass="bg-amber-400 text-slate-900"
            >
              سقف {capLabel}
            </LayerToggle>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16.5rem_minmax(0,1fr)] gap-4 items-start">
        <aside className="lg:sticky lg:top-4 space-y-2">
          {items.map((item) => {
            const isPinned = pinned.includes(item.id)
            const isOpen = visibleIds.has(item.id)
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-2.5 transition-colors ${
                  isOpen
                    ? 'border-emerald-300/60 bg-emerald-500/15'
                    : 'border-white/15 bg-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => toggleOpen(item.id)}
                    className="min-w-0 flex-1 text-right"
                  >
                    <span className="block font-bold text-white text-sm">{item.title}</span>
                    <span className="block mt-0.5 text-[11px] leading-relaxed text-white/60">{item.description}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    className={`shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold ${
                      isPinned
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                    title={isPinned ? 'نمودار همیشه نمایش داده می‌شود' : 'فقط با کلیک باز شود'}
                  >
                    {isPinned ? 'همیشه' : 'مخفی'}
                  </button>
                </div>
              </div>
            )
          })}
        </aside>

        <div className="min-w-0 space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 min-h-[16rem] flex items-center justify-center px-6 text-center text-sm text-white/55">
              نموداری انتخاب نشده. از فهرست سمت راست یکی را بزنید تا اینجا نمایش داده شود.
            </div>
          ) : (
            visible.map((item) => (
              <div key={item.id} id={`dashboard-chart-${item.id}`} className="scroll-mt-24">
                {compare && item.renderActual ? (
                  <div className={`grid grid-cols-1 items-start gap-3 ${layers.actual && layers.capped ? 'lg:grid-cols-2' : ''}`}>
                    {layers.actual && (
                      <ChartLayer label="واقعی" tone="actual">
                        {item.renderActual()}
                      </ChartLayer>
                    )}
                    {layers.capped && (
                      <ChartLayer label={`سقف ${capLabel}`} tone="cap">
                        {item.render()}
                      </ChartLayer>
                    )}
                  </div>
                ) : (
                  item.render()
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
