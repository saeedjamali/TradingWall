'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

let openModalCount = 0

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  zIndexClass = 'z-[100]',
}) {
  useEffect(() => {
    if (!isOpen) return

    openModalCount += 1
    document.body.style.overflow = 'hidden'

    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClass} overflow-y-auto`}>
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white text-gray-900 rounded-lg shadow-xl ${sizes[size] || sizes.md} w-full transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
