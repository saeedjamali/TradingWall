import Link from 'next/link'
import { HOME_FAQS } from '@/utils/seoFaqs'

export default function HomeSeoArticle({ latestPosts = [] }) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <section
      className="relative border-t border-white/10 bg-[#0b1220] text-gray-200"
      dir="rtl"
      aria-labelledby="seo-home-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
        <p className="text-emerald-400/90 text-xs font-semibold tracking-wide mb-2">
          راهنمای ژورنال و بک‌تست
        </p>
        <h2
          id="seo-home-heading"
          className="text-2xl md:text-3xl font-black text-white leading-snug"
        >
          ژورنال معاملاتی فارسی و بک‌تست فارکس در دیوار معاملاتی
        </h2>
        <p className="mt-4 text-sm md:text-base text-gray-300 leading-relaxed">
          دیوار معاملاتی یک ژورنال معاملاتی آنلاین برای ثبت، مرور و تحلیل معاملات
          است. به‌جای پراکنده نگه داشتن نتایج در اکسل یا دفتر، می‌توانید معاملات
          واقعی و بک‌تست را در یک جا ببینید: وین‌ریت، سود و زیان، تقویم معاملاتی
          و عملکرد ستاپ‌ها.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h3 className="text-lg font-bold text-white">ژورنال معاملاتی چیست؟</h3>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              ژورنال معاملاتی جایی است که هر ترید را با نتیجه، نماد و یادداشت ثبت
              می‌کنید تا الگوهای سودده و اشتباه‌های تکراری مشخص شود. در دیوار
              معاملاتی فایل MT5 یا اکسل را بارگذاری می‌کنید و گزارش عملکرد،
              تقویم و لیدربورد از همان داده‌ها ساخته می‌شود.
            </p>
            <Link
              href="/auth/register"
              className="inline-block mt-4 text-sm text-emerald-300 hover:text-emerald-200"
            >
              شروع ژورنال معاملاتی ←
            </Link>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h3 className="text-lg font-bold text-white">بک‌تست و بکتست فارکس</h3>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              بک‌تست (بکتست) یعنی آزمودن استراتژی روی چارت تاریخی قبل از ریسک
              سرمایه واقعی. اینجا چند بک‌تست در یک روز ثبت می‌شود، تعداد TP و SL
              شمرده می‌شود و گزارش ستاپ‌ها در تقویم ماهانه دیده می‌شود — بدون
              وابستگی به حجم لات.
            </p>
            <Link
              href="/backtest"
              className="inline-block mt-4 text-sm text-emerald-300 hover:text-emerald-200"
            >
              ورود به ژورنال بک‌تست ←
            </Link>
          </article>
        </div>

        <article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <h3 className="text-lg font-bold text-white">
            چالش بک‌تست و چالش معامله
          </h3>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            چالش‌ها برای رتبه‌بندی نیستند؛ هدف شناسایی نقاط ضعف و قوت روی یک نماد
            و تایم‌فریم مشخص است. چالش بک‌تست روی داده تاریخی است و چالش معامله
            روی معاملات واقعی در ژورنال. می‌توانید چالش عمومی یا خصوصی بسازید و
            با لینک دیگران را دعوت کنید.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href="/challenges" className="text-emerald-300 hover:text-emerald-200">
              معرفی چالش‌ها
            </Link>
            <Link
              href="/challenges/browse"
              className="text-emerald-300 hover:text-emerald-200"
            >
              مشاهده چالش‌های باز
            </Link>
            <Link href="/tools" className="text-emerald-300 hover:text-emerald-200">
              ابزار فارکس
            </Link>
            <Link href="/blog" className="text-emerald-300 hover:text-emerald-200">
              بلاگ آموزشی
            </Link>
          </div>
        </article>

        <article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <h3 className="text-lg font-bold text-white">بلاگ ژورنال معاملاتی</h3>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            در بلاگ، آموزش ثبت ژورنال، بک‌تست استراتژی، روانشناسی معامله و استفاده از
            ابزارهای فارکس را با کلمات کلیدی واقعی گوگل می‌نویسیم تا هم برای تریدرها
            مفید باشد و هم در جستجو پیدا شود.
          </p>
          {latestPosts.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm text-emerald-300 hover:text-emerald-200"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href="/blog"
            className="inline-block mt-4 text-sm text-emerald-300 hover:text-emerald-200"
          >
            مشاهده همه مقالات ←
          </Link>
        </article>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-5">سوالات پرتکرار</h3>
          <dl className="space-y-4">
            {HOME_FAQS.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
              >
                <dt className="font-semibold text-white text-sm md:text-base">
                  {item.q}
                </dt>
                <dd className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
