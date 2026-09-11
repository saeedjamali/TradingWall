'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSessionUser } from '@/utils/session'
import { UserName } from '@/components/VerifiedBadge'

export default function BlogEngage({ slug, commentsEnabled, initialComments, ratingAvg, ratingCount }) {
  const [sessionUser, setSessionUser] = useState(null)
  const [comments, setComments] = useState(initialComments || [])
  const [text, setText] = useState('')
  const [avg, setAvg] = useState(ratingAvg || 0)
  const [count, setCount] = useState(ratingCount || 0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setSessionUser(getSessionUser())
  }, [])

  const submitComment = async (e) => {
    e.preventDefault()
    if (!sessionUser?.id) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionUser.id, body: text }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'خطا')
      setComments((prev) => [data.comment, ...prev])
      setText('')
      setMessage('نظر شما ثبت شد')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitRate = async (value) => {
    if (!sessionUser?.id) {
      setMessage('برای امتیاز دادن وارد شوید')
      return
    }
    try {
      const res = await fetch(`/api/blog/${slug}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionUser.id, value }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'خطا')
      setAvg(data.ratingAvg)
      setCount(data.ratingCount)
      setMessage('امتیاز شما ثبت شد')
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-amber-400/25 bg-amber-950/20 p-5">
        <h2 className="text-lg font-bold text-amber-100 mb-3">امتیاز مقاله</h2>
        <p className="text-sm text-white/60 mb-3">
          میانگین {avg || 0} از ۵ · {count} رای
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => submitRate(star)}
              className={`text-2xl ${star <= Math.round(avg) ? 'text-amber-400' : 'text-white/25'}`}
              aria-label={`${star} ستاره`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {commentsEnabled && (
        <div className="rounded-3xl border border-sky-400/25 bg-sky-950/20 p-5">
          <h2 className="text-lg font-bold text-sky-100 mb-4">نظرات</h2>
          {sessionUser ? (
            <form onSubmit={submitComment} className="mb-6 space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full min-h-[110px] rounded-xl bg-black/30 border border-white/10 p-3 text-sm text-white"
                placeholder="تجربه یا سوال خود را بنویسید..."
                maxLength={1500}
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'در حال ارسال...' : 'ارسال نظر'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-white/60 mb-6">
              برای نظر دادن{' '}
              <Link href={`/auth/login?next=/blog/${slug}`} className="text-cyan-300 underline">
                وارد شوید
              </Link>
            </p>
          )}

          {message && <p className="text-sm text-amber-200 mb-4">{message}</p>}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-white/40">هنوز نظری ثبت نشده است.</p>
            ) : (
              comments.map((item) => (
                <article key={item._id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-white/50 mb-1 inline-flex items-center gap-1">
                    <UserName
                      name={item.userId?.publicName || 'کاربر'}
                      verified={item.userId?.verified}
                      badgeClassName="w-3 h-3 text-blue-400"
                    />
                    {item.createdAt
                      ? ` · ${new Date(item.createdAt).toLocaleDateString('fa-IR')}`
                      : ''}
                  </p>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{item.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
