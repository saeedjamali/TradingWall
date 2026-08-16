"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProposalForm from "@/components/ProposalForm";
import VerifiedBadge from "@/components/VerifiedBadge";
import Modal from "@/components/Modal";
import { getSessionUser } from "@/utils/session";
import { FEEDBACK_CATEGORY_VALUES } from "@/utils/feedbackCategories";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [homeBoards, setHomeBoards] = useState(null);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [supportCategory, setSupportCategory] = useState("other");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportReason, setSupportReason] = useState("");
  const [showMt5Guide, setShowMt5Guide] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const category = params.get("category");
      setSupportCategory(
        FEEDBACK_CATEGORY_VALUES.includes(category) ? category : "other",
      );
      setSupportPhone(params.get("phone") || "");
      setSupportReason(params.get("reason") || "");

      if (window.location.hash === "#support") {
        setTimeout(() => {
          document
            .getElementById("support")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/leaderboards?view=current");
        const data = await res.json();
        if (!cancelled && res.ok) setHomeBoards(data.boards);
      } catch {
        // ignore — show empty boards
      } finally {
        if (!cancelled) setBoardsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    setUser(null);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Candlestick Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center gap-2">
            <Link href="/" className="flex items-center min-w-0">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="Trading Wall"
                width={519}
                height={163}
                priority
                className="h-9 md:h-14 w-auto max-w-[200px] md:max-w-[280px]"
              />
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/tools"
                title="ابزار معامله"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden md:inline text-sm font-medium">
                  ابزار معامله
                </span>
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    title="داشبورد"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="hidden md:inline text-sm font-medium">
                      داشبورد
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="خروج"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="hidden md:inline text-sm font-medium">
                      خروج
                    </span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  title="ورود / ثبت نام"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden md:inline text-sm font-medium">
                    ورود / ثبت نام
                  </span>
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Trading Wall | دیوار معاملاتی
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed" dir="rtl">
            ژورنال معاملاتی فارسی برای ثبت ترید، تحلیل عملکرد، لیدربورد وین‌ریت و
            سود، دیوار عمومی تریدرها،{' '}
            <Link
              href="/tools"
              className="font-bold text-white underline underline-offset-4 decoration-cyan-400/60 hover:text-cyan-300"
            >
              ابزار معامله
            </Link>{' '}
            و{' '}
            <Link
              href="/backtest"
              className="font-bold text-white underline underline-offset-4 decoration-amber-400/60 hover:text-amber-300"
            >
              بک‌تست
            </Link>
          </p>
          <p className="text-base text-gray-400 mb-12 max-w-2xl mx-auto" dir="rtl">
            معاملات خود را ثبت کنید، ستاپ‌ها را مدیریت کنید، با تقویم معاملاتی
            انضباط بسنجید و از{' '}
            <Link href="/tools" className="font-semibold text-gray-200 hover:text-white">
              ابزارهای فارکس
            </Link>{' '}
            و{' '}
            <Link href="/backtest" className="font-semibold text-gray-200 hover:text-white">
              ژورنال بک‌تست
            </Link>{' '}
            استفاده کنید
          </p>

          {/* Upload Section */}
          <div className="max-w-xl mx-auto mb-20 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 mx-auto text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                بارگذاری معاملات
              </h3>
              <p className="text-gray-300 text-sm md:text-base mb-4 leading-relaxed">
                گزارش History را از MetaTrader ۵ دریافت کنید، یا الگوی Excel را
                خودتان تکمیل نمایید (مناسب TradingView و سایر پلتفرم‌ها). امکان
                افزودن معاملات به‌صورت یکجا یا روزانه وجود دارد و معاملات تکراری
                به‌صورت خودکار حذف می‌شوند.
              </p>
              <button
                type="button"
                onClick={() => setShowMt5Guide(true)}
                className="mb-6 text-sm text-primary-300 hover:text-primary-200 underline underline-offset-4"
              >
                راهنمای خروجی از MT5
              </button>

              {user ? (
                <Link
                  href="/dashboard/trades/upload"
                  className="block w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg text-center"
                >
                  بارگذاری فایل معاملات
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="block w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg text-center"
                >
                  ورود / ثبت نام برای بارگذاری
                </Link>
              )}
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <a
                  href="/api/templates/download?type=sample"
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📊 نمونه Excel
                </a>
                <span className="text-gray-500">|</span>
                <a
                  href="/api/templates/download?type=sample&format=csv"
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📋 نمونه CSV
                </a>
                <span className="text-gray-500">|</span>
                <a
                  href="/api/templates/download?type=template"
                  className="text-sm text-primary-400 hover:text-primary-300"
                  download
                >
                  📄 الگوی خالی
                </a>
              </div>
            </div>
          </div>

          <Modal
            isOpen={showMt5Guide}
            onClose={() => setShowMt5Guide(false)}
            title="راهنمای خروجی Excel از History در MT5"
            size="lg"
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                در MetaTrader ۵ از Toolbox به تب History بروید، راست‌کلیک کنید و
                Report ← Open XML را بزنید. می‌توانید All History، بازه ماهانه
                یا Custom Period را انتخاب کنید.
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src="/guides/mt5-history-export-guide.png"
                  alt="آموزش گرفتن خروجی Excel از History در MetaTrader 5"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                  sizes="(max-width: 640px) 100vw, 640px"
                />
              </div>
            </div>
          </Modal>

          {/* Trading tools CTA */}
          <div className="max-w-xl mx-auto mb-4">
            <Link
              href="/tools"
              className="block rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-blue-600/10 p-6 md:p-8 hover:border-cyan-300/50 transition-colors text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  ابزار معامله
                </h3>
                <span className="text-2xl">🕐</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                ساعت سشن‌های فارکس (سیدنی، توکیو، لندن، نیویورک)، تبدیل منطقه زمانی با
                احتساب تابستانه، و تعطیلات بازار و بانک نیویورک
              </p>
              <span className="inline-block mt-4 text-sm text-cyan-300 font-medium">
                مشاهده ابزارها ←
              </span>
            </Link>
          </div>

          {/* Leaderboards Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-white mb-8">
              برترین معامله‌گران
            </h2>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <HomeLeaderboardCard
                title="بالاترین وین‌ریت سال"
                minTrades={220}
                loading={boardsLoading}
                board={homeBoards?.winrate?.year}
              />
              <HomeLeaderboardCard
                title="بالاترین وین‌ریت ماه"
                minTrades={20}
                loading={boardsLoading}
                board={homeBoards?.winrate?.month}
              />
              <HomeLeaderboardCard
                title="بالاترین وین‌ریت هفته"
                minTrades={5}
                loading={boardsLoading}
                board={homeBoards?.winrate?.week}
              />
            </div>

            <div className="mt-8">
              <Link
                href="/leaderboards"
                className="inline-block px-8 py-3 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                مشاهده همه لیست‌ها
              </Link>
            </div>
          </div>
        </section>

        {/* Feedback / Development section */}
        <section id="support" className="container mx-auto px-4 py-16 scroll-mt-8">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
              این سایت در حال توسعه می‌باشد
            </h2>
            <p className="text-gray-300 text-center mb-6 text-sm md:text-base leading-relaxed">
              لطفاً انتقادات و چالش‌ها را برای توسعه سایت برای ما ارسال کنید.
              نظر شما به بخش نظرات مدیر می‌رود و پس از بررسی پاسخ دریافت
              می‌کنید.
            </p>

            {supportReason === "inactive" && (
              <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm text-center">
                حساب شما غیرفعال است. دسته‌بندی «فعال‌سازی کاربری» را انتخاب
                کرده و درخواست خود را برای پشتیبانی ارسال کنید.
              </div>
            )}

            <ProposalForm
              dark
              allowGuest
              requireLogin
              isLoggedIn={!!user}
              showCategory
              defaultCategory={
                supportReason === "inactive"
                  ? "account_activation"
                  : supportCategory
              }
              defaultPhone={supportPhone}
              defaultTitle={
                supportReason === "inactive" ? "درخواست فعال‌سازی حساب" : ""
              }
              submitLabel="ارسال نظر / پیشنهاد"
              onSubmit={async ({ title, body, image, category, phone }) => {
                const payload = {
                  type: "site_feedback",
                  title,
                  body,
                  image,
                  category,
                };
                if (user?.id) payload.userId = user.id;
                else if (phone) payload.phone = phone;

                const res = await fetch("/api/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                  throw new Error(data.error || "خطا در ارسال");
                }
              }}
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon="📊"
              title="تحلیل جامع"
              description="آمار و تحلیل کامل از معاملات با نمایش وین‌ریت، سود/زیان و شاخص‌های مهم"
            />
            <FeatureCard
              icon="📅"
              title="تقویم معاملاتی"
              description="مشاهده تقویم روزانه، هفتگی و ماهانه با امکان ثبت پلن و ژورنال"
            />
            <FeatureCard
              icon="🏆"
              title="رقابت سالم"
              description="مقایسه عملکرد با سایر معامله‌گران و کسب رتبه در جداول"
            />
            <FeatureCard
              icon="🛠️"
              title="ابزار معامله"
              description="ساعت سشن‌ها، همپوشانی بازارها، ماشین‌حساب ریسک و پیپ، راهنمای جفت‌ارز"
              href="/tools"
            />
            <FeatureCard
              icon="📈"
              title="بک‌تست"
              description="ثبت بک‌تست روزانه، گزارش TP/SL و عملکرد ستاپ‌ها در تقویم بک‌تست"
              href="/backtest"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function formatWinRate(value) {
  return `${Number(value).toFixed(1)}%`;
}

function HomeLeaderboardCard({ title, minTrades, board, loading }) {
  const topTraders = (board?.entries || []).slice(0, 3);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">حداقل {minTrades} معامله</p>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : topTraders.length === 0 ? (
        <p className="text-gray-400 text-center text-sm py-4">
          هنوز داده‌ای ثبت نشده
        </p>
      ) : (
        <div className="space-y-3">
          {topTraders.map((trader) => (
            <div
              key={trader.rank}
              className="flex items-center justify-between bg-white/5 rounded-lg p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold shrink-0 ${
                    trader.rank === 1
                      ? "bg-yellow-500 text-white"
                      : trader.rank === 2
                        ? "bg-gray-400 text-white"
                        : "bg-orange-600 text-white"
                  }`}
                >
                  {trader.rank}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  {trader.userId ? (
                    <Link
                      href={`/wall/${trader.userId}`}
                      className="text-white truncate hover:text-primary-300 hover:underline transition-colors"
                      title={
                        trader.wallPublic
                          ? "مشاهده دیوار کاربر"
                          : "وضعیت دیوار کاربر"
                      }
                    >
                      {trader.publicName || "کاربر"}
                    </Link>
                  ) : (
                    <span className="text-white truncate">
                      {trader.publicName || "کاربر"}
                    </span>
                  )}
                  {trader.verified && (
                    <VerifiedBadge className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </div>
              <span className="text-emerald-400 font-bold shrink-0">
                {formatWinRate(trader.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description, href }) {
  const inner = (
    <>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </>
  )

  const className =
    'bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors h-full block'

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }

  return <div className={className}>{inner}</div>
}
