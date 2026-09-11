import Link from 'next/link'
import { getPublicPosts } from '@/lib/blogQueries'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'
import { absoluteUrl, getSiteUrl, SITE_NAME_FA } from '@/utils/site'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage({ searchParams }) {
  const params = await searchParams
  const category = params?.category || ''
  const tag = params?.tag || ''
  const q = params?.q || ''
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1)
  const { posts, pages } = await getPublicPosts({ category, tag, q, page })
  const siteUrl = getSiteUrl()
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `بلاگ ${SITE_NAME_FA}`,
    url: absoluteUrl('/blog', siteUrl),
    inLanguage: 'fa-IR',
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`, siteUrl),
      datePublished: post.publishedAt,
      description: post.excerpt,
    })),
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />
      <p className="text-emerald-400/90 text-xs font-semibold mb-2">آموزش معامله‌گری</p>
      <h1 className="text-3xl md:text-4xl font-black mb-3">
        بلاگ ژورنال معاملاتی و بک‌تست فارکس
      </h1>
      <p className="text-white/65 max-w-2xl leading-relaxed mb-8">
        مقاله‌های کاربردی درباره ثبت ژورنال، بکتست استراتژی، روانشناسی معامله و ابزارهای
        فارکس </p>

      <form className="mb-8 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجو در مقالات..."
          className="flex-1 min-w-[180px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
        >
          <option value="">همه دسته‌ها</option>
          {Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="px-4 py-2 rounded-lg bg-primary-600 text-sm font-semibold">
          فیلتر
        </button>
      </form>

      {tag ? (
        <p className="text-sm text-white/50 mb-4">
          تگ: <span className="text-emerald-300">{tag}</span>
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-white/50 py-16 text-center">هنوز مقاله‌ای منتشر نشده است.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {posts.map((post) => (
            <article
              key={post._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-400/30 transition-colors"
            >
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt={post.coverImageAlt || post.title}
                  className="w-full h-44 object-contain bg-slate-950"
                />
              ) : null}
              <div className="p-5">
                <p className="text-[11px] text-emerald-300 mb-1">
                  {BLOG_CATEGORY_LABELS[post.category] || post.category}
                  {post.publishedAt
                    ? ` · ${new Date(post.publishedAt).toLocaleDateString('fa-IR')}`
                    : ''}
                </p>
                <h2 className="text-xl font-bold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-emerald-200">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-white/60 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(post.tags || []).slice(0, 4).map((item) => (
                    <Link
                      key={item}
                      href={`/blog?tag=${encodeURIComponent(item)}`}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/60"
                    >
                      #{item}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/blog?page=${n}${category ? `&category=${category}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`px-3 py-1 rounded-lg text-sm ${
                n === page ? 'bg-primary-600' : 'bg-white/10'
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  )
}
