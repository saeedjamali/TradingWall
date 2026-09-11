'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from './Button'

function UploadResultPanel({ result, compact }) {
  if (!result) return null

  const unknown = result.unknownSymbols || []
  const errorItems = result.errorItems || []
  const hasWarning = unknown.length > 0 || errorItems.length > 0 || result.duplicates > 0
  const tone = result.success
    ? hasWarning
      ? 'amber'
      : 'emerald'
    : 'rose'
  const box =
    tone === 'emerald'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-200 text-amber-950'
        : 'bg-rose-50 border-rose-200 text-rose-900'

  return (
    <div className={`mt-3 rounded-lg border p-3 text-right ${box}`} dir="rtl">
      <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
        {result.error && !result.totalParsed ? result.error : result.message}
      </p>

      {result.totalParsed != null && (
        <p className="text-xs mt-1 opacity-80">
          خوانده‌شده: {result.totalParsed}
          {result.totalSaved != null ? ` · ذخیره‌شده: ${result.totalSaved}` : ''}
          {result.duplicates ? ` · تکراری: ${result.duplicates}` : ''}
          {result.skippedRows ? ` · ردیف نامعتبر: ${result.skippedRows}` : ''}
        </p>
      )}

      {unknown.length > 0 && (
        <div className="mt-2 text-sm space-y-1">
          {unknown.map((item) => (
            <p key={item.code}>
              نماد «{item.code}» در فهرست نبود
              {item.similar?.length ? ` (نزدیک به ${item.similar.join('، ')})` : ''}
              ؛ {item.count} معامله به‌عنوان <strong>نماد جدید</strong> ذخیره شد
              و برای بررسی به مدیر ارسال شد.
            </p>
          ))}
          <p className="text-xs">
            نتیجه را در{' '}
            <Link href="/profile" className="underline font-semibold">
              پیام‌های پروفایل
            </Link>{' '}
            هم می‌بینید.
          </p>
        </div>
      )}

      {errorItems.length > 0 && (
        <div className="mt-2 text-sm">
          <p className="font-medium">معاملات ذخیره‌نشده:</p>
          <ul className="list-disc list-inside text-xs mt-1 space-y-0.5 max-h-36 overflow-y-auto">
            {errorItems.slice(0, 12).map((item, idx) => (
              <li key={`${item.trade}-${idx}`}>
                {item.symbol ? `نماد ${item.symbol}` : 'بدون نماد'}
                {item.trade ? ` (شماره ${item.trade})` : ''}
                {item.error ? ` — ${item.error}` : ''}
              </li>
            ))}
          </ul>
          {errorItems.length > 12 && (
            <p className="text-xs mt-1">و {errorItems.length - 12} مورد دیگر</p>
          )}
        </div>
      )}

      {result.totalSaved > 0 && (
        <Link
          href="/dashboard/trades"
          className="inline-block mt-2 text-xs font-semibold underline"
        >
          مشاهده معاملات
        </Link>
      )}
    </div>
  )
}

export default function FileUploadCard({ userId, onUploadSuccess, compact = false }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setResult(null)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !userId) {
      setResult({ success: false, error: 'لطفاً یک فایل انتخاب کنید', message: 'لطفاً یک فایل انتخاب کنید' })
      return
    }

    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/trades/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok && !data.message) {
        setResult({
          success: false,
          error: data.error || 'خطا در آپلود فایل',
          message: data.error || 'خطا در آپلود فایل',
          skippedRows: data.skippedRows,
        })
        return
      }

      setResult(data)
      if (data.totalSaved > 0) {
        setFile(null)
        if (onUploadSuccess) onUploadSuccess(data)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        error: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.',
        message: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (type) => {
    window.open(`/api/templates/download?type=${type}`, '_blank')
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-dashed border-blue-300">
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="font-bold text-gray-800 mb-2">📤 بارگذاری سریع</h3>
            <input
              type="file"
              id="file-upload-compact"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-compact"
              className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              انتخاب فایل
            </label>
          </div>

          {file && (
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-sm text-gray-700 truncate">{file.name}</p>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
                className="mt-2 w-full"
              >
                {uploading ? 'در حال آپلود...' : 'آپلود'}
              </Button>
            </div>
          )}

          <UploadResultPanel result={result} compact />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDownload('template')}
              className="px-2 py-1 bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              📄 خالی
            </button>
            <button
              onClick={() => handleDownload('sample')}
              className="px-2 py-1 bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              📊 نمونه
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 بارگذاری معاملات</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-3">📥 دانلود الگوها و نمونه‌ها</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleDownload('template')}
            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <span className="text-2xl">📄</span>
            <div className="text-right flex-1">
              <div className="font-medium text-gray-800">الگوی خالی</div>
              <div className="text-xs text-gray-600">Excel قابل ویرایش</div>
            </div>
          </button>

          <button
            onClick={() => handleDownload('sample')}
            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <span className="text-2xl">📊</span>
            <div className="text-right flex-1">
              <div className="font-medium text-gray-800">نمونه Excel</div>
              <div className="text-xs text-gray-600">مثال متاتریدر</div>
            </div>
          </button>

          <a
            href="/api/templates/download?type=sample&format=csv"
            download
            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <span className="text-2xl">📋</span>
            <div className="text-right flex-1">
              <div className="font-medium text-gray-800">نمونه CSV</div>
              <div className="text-xs text-gray-600">فرمت CSV ساده</div>
            </div>
          </a>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <span className="text-6xl">📁</span>
        </div>

        {file ? (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600">فایل انتخاب شده:</p>
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'در حال آپلود...' : '✅ آپلود فایل'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setFile(null); setResult(null) }}
                disabled={uploading}
              >
                ❌ انصراف
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-3">
              فایل Excel یا CSV خود را اینجا بکشید یا کلیک کنید
            </p>
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              انتخاب فایل
            </label>
            <p className="text-xs text-gray-500 mt-3">
              فرمت‌های پشتیبانی: Excel (.xlsx, .xls) و CSV (.csv)
            </p>
          </div>
        )}
      </div>

      <UploadResultPanel result={result} compact={false} />

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-gray-800 mb-2">💡 راهنما:</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>فایل باید خروجی History از متاتریدر باشد</li>
          <li>فرمت‌های پشتیبانی: Excel (.xlsx, .xls) و CSV (.csv)</li>
          <li>اگر نماد فایل در فهرست نباشد، معامله به‌عنوان نماد جدید ذخیره می‌شود و برای مدیر تیکت ثبت می‌گردد</li>
        </ul>
      </div>
    </div>
  )
}
