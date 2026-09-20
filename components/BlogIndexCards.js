import Link from 'next/link'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fa-IR')
}

function Meta({ post, featured = false, categoryLabels = BLOG_CATEGORY_LABELS }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${featured ? 'text-xs text-emerald-200/90' : 'text-[11px] text-emerald-300/90'}`}>
      {post.isPinned ? (
        <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 font-semibold">
          برگزیده
        </span>
      ) : null}
      <span>{categoryLabels[post.category] || post.category}</span>
      {post.publishedAt ? <span className="text-white/45">· {formatDate(post.publishedAt)}</span> : null}
      {post.readingMinutes ? <span className="text-white/45">· {post.readingMinutes} دقیقه</span> : null}
    </p>
  )
}

export function FeaturedPosts({ posts, categoryLabels }) {
  if (!posts?.length) return null
  const [hero, ...rest] = posts

  if (posts.length === 1) {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-amber-400/25 bg-slate-950">
        <Link href={`/blog/${hero.slug}`} className="block">
          {hero.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.coverImage}
              alt={hero.coverImageAlt || hero.title}
              className="w-full h-56 md:h-80 object-cover opacity-80 group-hover:opacity-95 transition-opacity"
            />
          ) : (
            <div className="h-56 md:h-72 bg-gradient-to-br from-emerald-900/50 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 blog-featured text-white">
            <Meta post={hero} featured categoryLabels={categoryLabels} />
            <h2 className="text-2xl md:text-3xl font-black mt-2 leading-snug">{hero.title}</h2>
            {hero.excerpt ? (
              <p className="mt-2 text-sm text-white/70 line-clamp-2 max-w-3xl">{hero.excerpt}</p>
            ) : null}
          </div>
        </Link>
      </article>
    )
  }

  return (
    <div className="grid md:grid-cols-5 gap-4">
      <article className="group relative md:col-span-3 overflow-hidden rounded-3xl border border-amber-400/25 bg-slate-950 min-h-[280px]">
        <Link href={`/blog/${hero.slug}`} className="block h-full">
          {hero.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.coverImage}
              alt={hero.coverImageAlt || hero.title}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="relative min-h-[280px] md:min-h-full flex flex-col justify-end p-5 md:p-7 blog-featured text-white">
            <Meta post={hero} featured categoryLabels={categoryLabels} />
            <h2 className="text-2xl md:text-[1.7rem] font-black mt-2 leading-snug">{hero.title}</h2>
            {hero.excerpt ? (
              <p className="mt-2 text-sm text-white/70 line-clamp-2">{hero.excerpt}</p>
            ) : null}
          </div>
        </Link>
      </article>
      <div className="md:col-span-2 grid gap-4">
        {rest.map((post) => (
          <article
            key={post._id}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-400/30 transition-colors"
          >
            <Link href={`/blog/${post.slug}`} className="flex h-full min-h-[7.5rem]">
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt={post.coverImageAlt || post.title}
                  className="w-[7.5rem] object-cover shrink-0"
                />
              ) : (
                <div className="w-[7.5rem] bg-slate-900 shrink-0" />
              )}
              <div className="p-3.5 flex-1 min-w-0">
                <Meta post={post} categoryLabels={categoryLabels} />
                <h3 className="font-bold mt-1.5 leading-snug line-clamp-3 group-hover:text-emerald-200">
                  {post.title}
                </h3>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export function CompactPostCard({ post, categoryLabels }) {
  return (
    <article className="group rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-400/30 transition-colors">
      <Link href={`/blog/${post.slug}`} className="flex gap-3 p-2.5 sm:p-3">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="w-[6.5rem] h-[4.6rem] sm:w-32 sm:h-[5.25rem] object-cover rounded-lg bg-slate-950 shrink-0"
          />
        ) : (
          <div className="w-[6.5rem] h-[4.6rem] sm:w-32 sm:h-[5.25rem] rounded-lg bg-slate-900 shrink-0" />
        )}
        <div className="min-w-0 flex-1 py-0.5">
          <Meta post={post} categoryLabels={categoryLabels} />
          <h3 className="font-bold mt-1 text-[0.95rem] sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-200">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="hidden sm:block mt-1 text-xs text-white/55 leading-relaxed line-clamp-1">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}

export function BlogPager({ page, pages, category, tag, q }) {
  if (pages <= 1) return null
  const hrefFor = (n) => {
    const params = new URLSearchParams()
    if (n > 1) params.set('page', String(n))
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)
    if (q) params.set('q', q)
    const qs = params.toString()
    return qs ? `/blog?${qs}` : '/blog'
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 mt-10" aria-label="صفحه‌بندی مقالات">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/15">
          قبلی
        </Link>
      ) : null}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          className={`px-3 py-1.5 rounded-lg text-sm ${n === page ? 'bg-primary-600' : 'bg-white/10 hover:bg-white/15'}`}
        >
          {n}
        </Link>
      ))}
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/15">
          بعدی
        </Link>
      ) : null}
    </nav>
  )
}
