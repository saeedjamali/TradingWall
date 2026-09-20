'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import ProposalForm from '@/components/ProposalForm'
import { getSessionUser } from '@/utils/session'

export default function SiteSupportButton() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getSessionUser())
  }, [open])

  const submitFeedback = async ({ title, body, image, category, phone }) => {
    const payload = {
      type: 'site_feedback',
      title,
      body,
      image,
      category,
    }
    if (user?.id) payload.userId = user.id
    else if (phone) payload.phone = phone

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'خطا در ارسال پیام')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 bottom-5 start-4 sm:bottom-6 sm:start-6 print:hidden inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-black/30 ring-1 ring-white/15 transition-colors hover:bg-sky-500"
        aria-label="ارتباط با پشتیبانی"
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
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72A7.45 7.45 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>پشتیبانی</span>
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="ارتباط با پشتیبانی"
        size="md"
      >
        <div dir="rtl" className="max-h-[75vh] overflow-y-auto px-1">
          <p className="mb-4 text-sm text-gray-500">
            سؤال، پیشنهاد یا مشکل خود را بنویسید؛ پاسخ در بخش پیام‌های پروفایل قابل پیگیری است.
          </p>
          <ProposalForm
            allowGuest
            requireLogin
            isLoggedIn={!!user}
            showCategory
            defaultPhone={user?.phone || ''}
            submitLabel="ارسال پیام"
            onSubmit={submitFeedback}
          />
        </div>
      </Modal>
    </>
  )
}
