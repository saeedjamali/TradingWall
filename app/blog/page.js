import Link from 'next/link'
import { getPinnedPosts, getPublicPosts } from '@/lib/blogQueries'
import { BLOG_CATEGORY_LABELS } from '@/utils/blog'
import { absoluteUrl, getSiteUrl, SITE_NAME_FA } from '@/utils/site'
import { BlogPager, CompactPostCard, FeaturedPosts } from '@/components/BlogIndexCards'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage({ searchParams }) {
  const params = await searchParams
  const category = params?.category || ''
  const tag = params?.tag || ''
  const q = params?.q || ''
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1)
  const searching = Boolean(q)

  const pinned = searching ? [] : await getPinnedPosts({ category, tag, limit: 3 })
  const excludeIds = pinned.map((post) => post._id)
  const { posts, pages, total } = await getPublicPosts({
    category,
    tag,
    q,
    page,
    limit: 10,
    excludeIds,
  })
  const featured = page === 1 && !searching ? pinned : []
  const siteUrl = getSiteUrl()
  const ldPosts = [...featured, ...posts]
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `بلاگ ${SITE_NAME_FA}`,
    url: absoluteUrl('/blog', siteUrl),
    inLanguage: 'fa-IR',
    blogPost: ldPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`, siteUrl),
      datePublished: post.publishedAt,
      description: post.excerpt,
    })),
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />
      <p className="text-emerald-400/90 text-xs font-semibold mb-2">آموزش معامله‌گری</p>
      <h1 className="text-3xl md:text-4xl font-black mb-3">
        بلاگ ژورنال معاملاتی و بک‌تست فارکس
      </h1>
      <p className="text-white/65 max-w-2xl leading-relaxed mb-6">
        مقاله‌های کاربردی درباره ثبت ژورنال، بکتست استراتژی، روانشناسی معامله و ابزارهای فارکس
      </p>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجو در مقالات..."
          className="flex-1 min-w-[180px] rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/45"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
        >
          <option value="" className="bg-slate-900 text-white">
            همه دسته‌ها
          </option>
          {Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value} className="bg-slate-900 text-white">
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold"
        >
          فیلتر
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/blog"
          className={`text-xs px-3 py-1.5 rounded-full border ${
            !category && !tag
              ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-200'
              : 'border-white/10 text-white/55 hover:text-white'
          }`}
        >
          همه
        </Link>
        {Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/blog?category=${value}`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              category === value
                ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-200'
                : 'border-white/10 text-white/55 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tag ? (
        <p className="text-sm text-white/50 mb-4">
          تگ: <span className="text-emerald-300">{tag}</span>
        </p>
      ) : null}

      {featured.length === 0 && posts.length === 0 ? (
        <p className="text-white/50 py-16 text-center">هنوز مقاله‌ای منتشر نشده است.</p>
      ) : (
        <div className="space-y-10">
          {featured.length > 0 ? (
            <section>
              <div className="flex items-end justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold">برگزیده‌ها</h2>
                <p className="text-xs text-white/40">پست‌های ثابت در مورد معامله گری</p>
              </div>
              <FeaturedPosts posts={featured} />
            </section>
          ) : null}

          {posts.length > 0 ? (
            <section>
              <div className="flex items-end justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold">
                  {searching ? 'نتایج جستجو' : featured.length ? 'سایر مقالات' : 'مقالات'}
                </h2>
                <p className="text-xs text-white/40">{total} مقاله</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {posts.map((post) => (
                  <CompactPostCard key={post._id} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <BlogPager page={page} pages={pages} category={category} tag={tag} q={q} />
    </main>
  )
}
