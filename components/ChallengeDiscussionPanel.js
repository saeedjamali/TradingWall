'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserName } from '@/components/VerifiedBadge'
import { validateImageFile } from '@/utils/uploadLimits'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function ChallengeDiscussionPanel({ challengeCode, user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyImage, setReplyImage] = useState('')

  const load = useCallback(async () => {
    if (!challengeCode || !user?.id) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `/api/challenges/${challengeCode}/discussion?userId=${encodeURIComponent(user.id)}`,
      )
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در دریافت گفتگو')
      }
      setItems(data.discussions || [])
    } catch (err) {
      setError(err.message || 'خطا در دریافت گفتگو')
    } finally {
      setLoading(false)
    }
  }, [challengeCode, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const childrenByParent = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const key = item.parentId || 'root'
      const list = map.get(key) || []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  const uploadImage = async (file, setValue) => {
    if (!file) return
    const check = validateImageFile(file)
    if (!check.ok) {
      setError(check.error)
      return
    }
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', 'challengeDiscussion')
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در آپلود تصویر')
      }
      setValue(data.url)
    } catch (err) {
      setError(err.message || 'خطا در آپلود تصویر')
    } finally {
      setUploading(false)
    }
  }

  const submit = async ({ text, attachedImage, parentId = null }) => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(
        `/api/challenges/${challengeCode}/discussion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            body: text.trim(),
            image: attachedImage || null,
            parentId,
          }),
        },
      )
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت گفتگو')
      }
      if (parentId) {
        setReplyBody('')
        setReplyImage('')
        setReplyingTo(null)
      } else {
        setBody('')
        setImage('')
      }
      await load()
    } catch (err) {
      setError(err.message || 'خطا در ثبت گفتگو')
    } finally {
      setSaving(false)
    }
  }

  const vote = async (discussionId, value) => {
    setError('')
    try {
      const response = await fetch(
        `/api/challenges/${challengeCode}/discussion/${discussionId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, value }),
        },
      )
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت رأی')
      }
      setItems((current) =>
        current.map((item) =>
          item.id === discussionId
            ? {
                ...item,
                likeCount: data.likeCount,
                dislikeCount: data.dislikeCount,
                myVote: data.myVote,
              }
            : item,
        ),
      )
    } catch (err) {
      setError(err.message || 'خطا در ثبت رأی')
    }
  }

  const openReply = (item) => {
    setReplyingTo(item.id)
    setReplyBody('')
    setReplyImage('')
  }

  const renderThread = (item, depth = 0) => (
    <article
      key={item.id}
      className={`rounded-xl border border-gray-200 bg-white p-3 sm:p-4 ${
        depth ? 'mt-2' : 'mt-3'
      }`}
      style={{ marginInlineStart: `${Math.min(depth, 4) * 18}px` }}
    >
      <div className="flex items-start gap-2.5">
        {item.user?.profileImage ? (
          <img
            src={item.user.profileImage}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 text-slate-500 grid place-items-center font-bold">
            {item.user?.publicName?.trim()?.[0] || 'ک'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <UserName
              name={item.user?.publicName}
              verified={item.user?.verified}
              className="text-sm font-bold text-gray-900"
              badgeClassName="h-3.5 w-3.5 text-blue-500"
            />
            <span className="text-[10px] text-gray-400">
              {formatDate(item.createdAt)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {item.body}
          </p>
          {item.image && (
            <a
              href={item.image}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block"
            >
              <img
                src={item.image}
                alt="تصویر پیوست گفتگو"
                className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain"
              />
            </a>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => vote(item.id, 1)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                item.myVote === 1
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              پسندیدم {item.likeCount || 0}
            </button>
            <button
              type="button"
              onClick={() => vote(item.id, -1)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                item.myVote === -1
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              نپسندیدم {item.dislikeCount || 0}
            </button>
            <button
              type="button"
              onClick={() => openReply(item)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
            >
              پاسخ
            </button>
          </div>

          {replyingTo === item.id && (
            <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/50 p-3">
              <textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder={`پاسخ به ${item.user?.publicName || 'کاربر'}...`}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-600">
                  {uploading ? 'در حال آپلود...' : 'افزودن تصویر'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], setReplyImage)
                    }
                  />
                </label>
                {replyImage && (
                  <button
                    type="button"
                    onClick={() => setReplyImage('')}
                    className="text-[11px] text-rose-600"
                  >
                    حذف تصویر
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    submit({
                      text: replyBody,
                      attachedImage: replyImage,
                      parentId: item.id,
                    })
                  }
                  disabled={!replyBody.trim() || saving || uploading}
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                >
                  ثبت پاسخ
                </button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-[11px] text-gray-500"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(childrenByParent.get(item.id) || []).map((child) =>
        renderThread(child, depth + 1),
      )}
    </article>
  )

  return (
    <section className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900">گفتگوی شرکت‌کنندگان</h2>
          <p className="mt-1 text-xs text-gray-500">
            پرسش‌ها و تجربه‌های مربوط به همین چالش را مطرح کنید.
          </p>
        </div>
        <span className="text-[11px] text-gray-400">
          {items.length} پیام
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-sky-100 bg-white p-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="پرسش یا نکته خود را بنویسید..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-md border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
            {uploading ? 'در حال آپلود...' : 'افزودن تصویر'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) =>
                uploadImage(event.target.files?.[0], setImage)
              }
            />
          </label>
          {image && (
            <button
              type="button"
              onClick={() => setImage('')}
              className="text-[11px] text-rose-600"
            >
              حذف تصویر
            </button>
          )}
          <button
            type="button"
            onClick={() => submit({ text: body, attachedImage: image })}
            disabled={!body.trim() || saving || uploading}
            className="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? 'در حال ثبت...' : 'ثبت پرسش'}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">
          در حال دریافت گفتگو...
        </p>
      ) : (childrenByParent.get('root') || []).length ? (
        <div className="mt-3">
          {(childrenByParent.get('root') || []).map((item) =>
            renderThread(item),
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          هنوز گفتگویی ثبت نشده است؛ اولین پرسش را شما مطرح کنید.
        </p>
      )}
    </section>
  )
}
