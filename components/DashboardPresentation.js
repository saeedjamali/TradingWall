'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { captureElement } from '@/utils/captureElement'

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
  calendarFileName = 'tradingwall-calendar.png',
}) {
  const calendarStageRef = useRef(null)
  const calendarSlotRef = useRef(null)
  const chartStageRef = useRef(null)
  const contentRef = useRef(null)
  const onCalendarZoomRef = useRef(onCalendarZoom)
  const exportingRef = useRef(false)
  const [exporting, setExporting] = useState(false)
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
      if (exportingRef.current) return
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
      if (exportingRef.current) return
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
      if (content.style.getPropertyValue('--slide-zoom') !== zoom) {
        content.style.setProperty('--slide-zoom', zoom)
      }
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    observer.observe(content)
    return () => observer.disconnect()
  }, [slide, chart?.id])

  const downloadCanvas = (canvas, fileName) => {
    const link = document.createElement('a')
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleExport = async () => {
    if (exportingRef.current) return
    exportingRef.current = true
    setExporting(true)
    const chartId = chart?.id
    const chartTitle = chart?.title
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve))

      if (slide === 0) {
        const card = calendarStageRef.current?.querySelector('.calendar-export-section')
        const wrap = card?.parentElement
        if (!card) return
        const previousTransform = card.style.transform
        const previousWidth = card.style.width
        const previousHeight = wrap?.style.height
        const previousOverflow = wrap?.style.overflow
        const watermark = card.querySelector('.calendar-export-watermark')
        const previousWatermarkTransform = watermark?.style.transform || ''
        card.style.transform = 'none'
        card.style.width = '100%'
        if (wrap) {
          wrap.style.height = 'auto'
          wrap.style.overflow = 'visible'
        }
        if (watermark) watermark.style.transform = 'none'
        try {
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          const canvas = await captureElement(card, {
            backgroundColor: '#f9fafb',
            scale: 2,
            logging: false,
            useCORS: true,
          })
          downloadCanvas(canvas, calendarFileName)
        } finally {
          card.style.transform = previousTransform
          card.style.width = previousWidth
          if (watermark) watermark.style.transform = previousWatermarkTransform
          if (wrap) {
            wrap.style.height = previousHeight || ''
            wrap.style.overflow = previousOverflow || ''
          }
        }
        return
      }

      const frame = contentRef.current
      if (!frame) return
      const previousZoom = frame.style.zoom
      const previousSlideZoom = frame.style.getPropertyValue('--slide-zoom')
      frame.style.zoom = '1'
      frame.style.setProperty('--slide-zoom', '1')
      try {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const canvas = await captureElement(frame, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        })
        downloadCanvas(canvas, `tradingwall-${chartId || chartTitle || 'chart'}.png`)
      } finally {
        frame.style.zoom = previousZoom
        if (previousSlideZoom) frame.style.setProperty('--slide-zoom', previousSlideZoom)
        else frame.style.removeProperty('--slide-zoom')
      }
    } catch (error) {
      console.error(error)
      alert('خطا در دانلود تصویر')
    } finally {
      exportingRef.current = false
      setExporting(false)
    }
  }

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
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            title="دانلود تصویر همین اسلاید"
          >
            {exporting ? '...' : 'تصویر'}
          </button>
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
          <div ref={contentRef} className="presentation-slide-frame relative max-w-full">
            {chart.render()}
            <span className="slide-frame-watermark blog-watermark blog-watermark-lg" aria-hidden="true">
              tradingwall.ir
            </span>
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
