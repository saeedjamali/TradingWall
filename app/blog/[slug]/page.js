import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicPostBySlug } from '@/lib/blogQueries'
import { BLOG_CATEGORY_LABELS, renderBlogHtml, commentsNeedApproval } from '@/utils/blog'
import { getActiveBlogCategories } from '@/utils/siteSettings'
import { absoluteUrl, getSiteUrl, SITE_NAME_FA } from '@/utils/site'
import { buildShareMetadata, publicPageUrl, shareImage } from '@/utils/shareMeta'
import BlogVideo from '@/components/BlogVideo'
import BlogEngage from '@/components/BlogEngage'
import BlogZoomRoot, { BlogFigure } from '@/components/BlogMedia'
import ShareLinkButton from '@/components/ShareLinkButton'
import BalePreviewTags from '@/components/BalePreviewTags'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await getPublicPostBySlug(slug)
  if (!data?.post) {
    return { title: 'مقاله یافت نشد', robots: { index: false } }
  }
  const post = data.post
  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || post.title
  return buildShareMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    imageAlt: post.coverImageAlt || post.title,
    type: 'article',
    keywords: post.keywords?.length ? post.keywords : post.tags,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    noindex: post.isVisible === false,
  })
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const data = await getPublicPostBySlug(slug, { countView: true })
  if (!data?.post) notFound()
  const { post, related, comments } = data
  const managedCategories = await getActiveBlogCategories()
  const categoryLabels = {
    ...BLOG_CATEGORY_LABELS,
    ...Object.fromEntries(
      managedCategories.map((item) => [item.slug, item.label]),
    ),
  }
  const postCategories = post.categories?.length
    ? post.categories
    : [post.category].filter(Boolean)
  const siteUrl = getSiteUrl()

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.authorName || SITE_NAME_FA },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME_FA,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/tradingwall-icon-512x512.png', siteUrl) },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`, siteUrl),
    image: post.coverImage ? [absoluteUrl(post.coverImage, siteUrl)] : undefined,
    keywords: (post.keywords || post.tags || []).join(', '),
    articleSection: postCategories
      .map((item) => categoryLabels[item] || item)
      .join('، '),
    wordCount: String(post.body || '').trim().split(/\s+/).filter(Boolean).length,
  }

  if (post.ratingCount > 0) {
    articleLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: post.ratingAvg,
      ratingCount: post.ratingCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (post.videoUrl || post.videoFile) {
    articleLd.video = {
      '@type': 'VideoObject',
      name: post.title,
      description: post.seoDescription || post.excerpt || post.title,
      uploadDate: post.publishedAt,
      thumbnailUrl: post.coverImage ? [absoluteUrl(post.coverImage, siteUrl)] : undefined,
      contentUrl: post.videoFile ? absoluteUrl(post.videoFile, siteUrl) : undefined,
      embedUrl: post.videoUrl || undefined,
    }
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'بلاگ', item: absoluteUrl('/blog', siteUrl) },
      { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`, siteUrl) },
    ],
  }

  const faqLd =
    post.faqs?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faqs.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }
      : null

  const howToLd =
    post.howToSteps?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: post.title,
          description: post.seoDescription || post.excerpt,
          image: post.coverImage ? [absoluteUrl(post.coverImage, siteUrl)] : undefined,
          totalTime: `PT${post.readingMinutes || 5}M`,
          step: post.howToSteps.map((item, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: item.name,
            text: item.text,
          })),
        }
      : null

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl space-y-6" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      ) : null}
      {howToLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      ) : null}

      <BalePreviewTags
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || post.title}
        image={shareImage(post.coverImage, post.coverImageAlt || post.title).url}
        url={publicPageUrl(`/blog/${post.slug}`)}
      />

      <header className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/55 via-slate-900/40 to-cyan-950/40 p-6 md:p-8">
        <nav className="text-xs text-emerald-200/70 mb-4">
          <Link href="/blog" className="hover:text-white">بلاگ</Link>
          {' / '}
          <span className="text-cyan-200">{categoryLabels[post.category] || post.category}</span>
        </nav>
        <div className="mb-3 flex flex-wrap gap-2">
          {postCategories.map((item) => (
            <Link
              key={item}
              href={`/blog?category=${encodeURIComponent(item)}`}
              className="inline-flex rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
            >
              {categoryLabels[item] || item}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-black leading-snug text-white">{post.title}</h1>
          <ShareLinkButton
            title={post.title}
            text={post.excerpt || post.seoDescription || post.title}
            url={publicPageUrl(`/blog/${post.slug}`)}
            className="mt-1 shrink-0"
          />
        </div>
        <p className="text-sm text-white/55 mt-4">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fa-IR') : ''}
          {post.updatedAt && post.publishedAt && new Date(post.updatedAt) > new Date(post.publishedAt)
            ? ` · به‌روزرسانی ${new Date(post.updatedAt).toLocaleDateString('fa-IR')}`
            : ''}
          {` · ${post.readingMinutes} دقیقه مطالعه`}
          {` · ${post.views || 0} بازدید`}
        </p>
      </header>

      <BlogZoomRoot className="space-y-6">
        {post.coverImage ? (
          <BlogFigure
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="rounded-3xl overflow-hidden border border-cyan-400/20 bg-slate-950/70 p-2"
            imgClassName="w-full rounded-2xl max-h-[520px] object-contain"
          />
        ) : null}

        {(post.videoUrl || post.videoFile) && (
          <section className="rounded-3xl border border-violet-400/25 bg-violet-950/25 p-3">
            <BlogVideo url={post.videoUrl} file={post.videoFile} />
          </section>
        )}

        {post.excerpt ? (
          <p className="rounded-2xl border border-cyan-400/25 bg-cyan-950/25 px-5 py-4 text-lg text-cyan-50/90 leading-relaxed">
            {post.excerpt}
          </p>
        ) : null}

        <article
          className="blog-body rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-8"
          dangerouslySetInnerHTML={{ __html: renderBlogHtml(post.body) }}
        />

        {(post.gallery || []).length > 0 && (
          <section className="rounded-3xl border border-sky-400/20 bg-sky-950/20 p-4">
            <h2 className="text-sm font-bold text-sky-200 mb-3">گالری</h2>
            <div className="grid grid-cols-2 gap-3">
              {post.gallery.map((src) => (
                <BlogFigure
                  key={src}
                  src={src}
                  alt={post.title}
                  imgClassName="rounded-xl w-full object-cover max-h-48"
                />
              ))}
            </div>
          </section>
        )}
      </BlogZoomRoot>

      {(post.tags || []).length > 0 && (
        <section className="rounded-2xl border border-amber-400/25 bg-amber-950/20 p-4">
          <h2 className="text-sm font-bold text-amber-200 mb-3">برچسب‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {(post.tags || []).map((item) => (
              <Link
                key={item}
                href={`/blog?tag=${encodeURIComponent(item)}`}
                className="text-xs px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
              >
                #{item}
              </Link>
            ))}
          </div>
        </section>
      )}

      {post.faqs?.length > 0 && (
        <section className="rounded-3xl border border-fuchsia-400/25 bg-fuchsia-950/20 p-5 md:p-6">
          <h2 className="text-xl font-bold text-fuchsia-100 mb-4">سوالات پرتکرار</h2>
          <dl className="space-y-3">
            {post.faqs.map((item) => (
              <div key={item.q} className="rounded-xl border border-fuchsia-300/15 bg-black/20 p-4">
                <dt className="font-semibold text-fuchsia-100">{item.q}</dt>
                <dd className="text-sm text-white/70 mt-2 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <BlogEngage
        slug={post.slug}
        commentsEnabled={post.commentsEnabled}
        commentsRequireApproval={commentsNeedApproval(post)}
        initialComments={comments}
        ratingAvg={post.ratingAvg}
        ratingCount={post.ratingCount}
      />

      {related.length > 0 && (
        <section className="rounded-3xl border border-emerald-400/25 bg-emerald-950/20 p-5 md:p-6">
          <h2 className="text-xl font-bold text-emerald-100 mb-4">مقالات مرتبط</h2>
          <div className="grid gap-3">
            {related.map((item) => (
              <Link
                key={item._id}
                href={`/blog/${item.slug}`}
                className="rounded-xl border border-emerald-300/15 bg-black/20 p-4 hover:border-emerald-400/40"
              >
                <p className="text-xs text-emerald-300 mb-1">
                  {categoryLabels[item.category] || item.category}
                </p>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="text-sm text-white/55 mt-1 line-clamp-2">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
