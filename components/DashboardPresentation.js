'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function fa(value) {
  return Number(value).toLocaleString('fa-IR')
}

function anotherOverlayIsOpen() {
  return [...document.querySelectorAll('body > .fixed.inset-0')].some(
    (node) => !node.hasAttribute('data-dashboard-presentation'),
  )
}

export default function DashboardPresentation({
  slide,
  charts,
  onSlide,
  onClose,
  onCalendarZoom,
  onCalendarSlot,
}) {
  const calendarStageRef = useRef(null)
  const calendarSlotRef = useRef(null)
  const chartStageRef = useRef(null)
  const contentRef = useRef(null)
  const onCalendarZoomRef = useRef(onCalendarZoom)
  const total = charts.length + 1
  const chart = slide > 0 ? charts[slide - 1] : null
  onCalendarZoomRef.current = onCalendarZoom

  useEffect(() => {
    onCalendarSlot(calendarSlotRef.current)
    return () => onCalendarSlot(null)
  }, [onCalendarSlot])

  useEffect(() => {
    document.documentElement.classList.add('tw-presenting')
    const onKey = (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return
      if (anotherOverlayIsOpen()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageDown') {
        event.preventDefault()
        onSlide((current) => Math.min(total - 1, current + 1))
      } else if (event.key === 'ArrowRight' || event.key === 'PageUp') {
        event.preventDefault()
        onSlide((current) => Math.max(0, current - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('tw-presenting')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, onSlide, total])

  useLayoutEffect(() => {
    if (slide !== 0) return
    const stage = calendarStageRef.current
    if (!stage) return

    let observedCard = null
    const cardObserver = new ResizeObserver(() => fit())
    function fit() {
      const card = stage.querySelector('.calendar-export-section')
      if (!card) return
      if (observedCard !== card) {
        cardObserver.disconnect()
        cardObserver.observe(card)
        observedCard = card
      }
      const naturalH = card.offsetHeight
      const naturalW = card.offsetWidth
      const availH = stage.clientHeight - 16
      const availW = stage.clientWidth - 16
      if (!naturalH || !naturalW || availH < 80 || availW < 80) return
      const zoom = Math.max(0.35, Math.min(1, availW / naturalW, availH / naturalH))
      onCalendarZoomRef.current?.(Math.round(zoom * 1000) / 1000, naturalH)
    }

    fit()
    const stageObserver = new ResizeObserver(fit)
    stageObserver.observe(stage)
    const mutations = new MutationObserver(fit)
    mutations.observe(stage, { childList: true, subtree: true })
    return () => {
      stageObserver.disconnect()
      cardObserver?.disconnect()
      mutations.disconnect()
    }
  }, [slide])

  useLayoutEffect(() => {
    const stage = chartStageRef.current
    const content = contentRef.current
    if (!stage || !content || slide === 0) return

    const fit = () => {
      const availW = Math.max(0, stage.clientWidth - 32)
      const availH = Math.max(0, stage.clientHeight - 16)
      if (availW < 80 || availH < 80) return
      const base = Math.min(860, availW)
      const width = `${base}px`
      if (content.style.width !== width) content.style.width = width
      const naturalW = content.offsetWidth || base
      const naturalH = content.offsetHeight
      if (!naturalW || !naturalH) return
      const next = Math.max(0.45, Math.min(1.8, availW / naturalW, availH / naturalH))
      const zoom = String(Math.round(next * 1000) / 1000)
      if (content.style.zoom !== zoom) content.style.zoom = zoom
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    observer.observe(content)
    return () => observer.disconnect()
  }, [slide, chart?.id])

  if (typeof document === 'undefined' || slide == null) return null

  const title = slide === 0 ? 'تقویم معاملاتی' : chart?.title
  const description =
    slide === 0
      ? 'با دکمه بعد، نمودارها یکی‌یکی نمایش داده می‌شوند.'
      : chart?.description

  return createPortal(
    <div
      data-dashboard-presentation
      className="dashboard-presentation fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="نمایش تمام‌صفحه داشبورد"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{title}</p>
          <p className="truncate text-xs text-white/60">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-white/70">
            {fa(slide + 1)} از {fa(total)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            بستن
          </button>
        </div>
      </div>

      <div
        ref={calendarStageRef}
        className={slide === 0 ? 'flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-2' : 'hidden'}
      >
        <div ref={calendarSlotRef} className="flex h-full w-full items-center justify-center" />
      </div>

      <div
        ref={chartStageRef}
        className={slide > 0 ? 'flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-3' : 'hidden'}
      >
        {slide > 0 && chart ? (
          <div ref={contentRef} className="max-w-full">
            {chart.render()}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => onSlide((current) => Math.max(0, current - 1))}
          disabled={slide === 0}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-white/20 disabled:opacity-40"
        >
          قبل
        </button>
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto px-2">
          <button
            type="button"
            onClick={() => onSlide(0)}
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${slide === 0 ? 'bg-emerald-400' : 'bg-white/30'}`}
            title="تقویم معاملاتی"
            aria-label="تقویم معاملاتی"
          />
          {charts.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSlide(index + 1)}
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                slide === index + 1 ? 'bg-emerald-400' : 'bg-white/30'
              }`}
              title={item.title}
              aria-label={item.title}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSlide((current) => Math.min(total - 1, current + 1))}
          disabled={slide >= total - 1}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 enabled:hover:bg-emerald-400 disabled:opacity-40"
        >
          بعد
        </button>
      </div>
    </div>,
    document.body,
  )
}
