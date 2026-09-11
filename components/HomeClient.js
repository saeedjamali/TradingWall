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
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [homeBoards, setHomeBoards] = useState(null);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [supportCategory, setSupportCategory] = useState("other");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportReason, setSupportReason] = useState("");
  const [showMt5Guide, setShowMt5Guide] = useState(false);
  const [openChallenges, setOpenChallenges] = useState([]);
  const [homeChallengeQ, setHomeChallengeQ] = useState("");
  const [homeChallengeType, setHomeChallengeType] = useState("");
  const [homeChallengeAccess, setHomeChallengeAccess] = useState("");

  useEffect(() => {
    const sessionUser = getSessionUser();
    setUser(sessionUser);

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
        // ignore
      } finally {
        if (!cancelled) setBoardsLoading(false);
      }
    })();

    (async () => {
      try {
        const params = new URLSearchParams({
          scope: 'public',
          phase: 'active',
          limit: '4',
        })
        if (sessionUser?.id) params.set('viewerId', sessionUser.id)
        const res = await fetch(`/api/challenges?${params}`)
        const data = await res.json()
        if (!cancelled && data.success) {
          setOpenChallenges(data.challenges || [])
        }
      } catch {
        // ignore
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
    <main className="page-shell overflow-hidden">
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-4 md:py-6">
          <nav className="flex justify-between items-center gap-2">
            <Link href="/" className="flex items-center min-w-0">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="دیوار معاملاتی"
                width={519}
                height={163}
                priority
                className="h-9 md:h-12 w-auto max-w-[180px] md:max-w-[240px]"
              />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ThemeToggle />
              <Link
                href="/blog"
                title="بلاگ آموزشی"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <NavIcon path="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                <span className="hidden md:inline text-sm font-medium">
                  بلاگ
                </span>
              </Link>
              <Link
                href="/tools"
                title="ابزار معامله"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <NavIcon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <span className="hidden md:inline text-sm font-medium">
                  ابزار
                </span>
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    title="داشبورد"
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    <span className="hidden md:inline text-sm font-medium">
                      داشبورد
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="خروج"
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <NavIcon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    <span className="hidden md:inline text-sm font-medium">
                      خروج
                    </span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  title="ورود"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <NavIcon path="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  <span className="text-sm font-medium">ورود</span>
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Hero — logo banner */}
        <section className="container mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12">
          <div className="home-hero-banner relative max-w-4xl mx-auto overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950/40 shadow-[0_20px_60px_-24px_rgba(16,185,129,0.35)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 18h-2v4h-4v2h4v4h2v-4h4v-2h-4v-4zm0-16h-2v4h-4v2h4v4h2V8h4V6h-4V2zM4 18H2v4H0v2h2v4h2v-4h2v-2H4v-4zM4 2H2v4H0v2h2v4h2V8h2V6H4V2z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            <div className="relative px-5 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 flex flex-col items-center text-center">
              <Image
                src="/logo/tradinggwall-logo-horizontal.svg"
                alt="ژورنال معاملاتی دیوار معاملاتی"
                width={1038}
                height={326}
                priority
                className="w-full max-w-[280px] sm:max-w-[420px] md:max-w-[560px] h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
              />
              <h1
                className="mt-5 md:mt-6 text-base sm:text-lg md:text-xl font-bold text-white max-w-xl leading-relaxed"
                dir="rtl"
              >
                ژورنال معاملاتی و بک‌تست فارکس
              </h1>
              <p
                className="mt-2 text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed"
                dir="rtl"
              >
                ثبت معاملات، بکتست، چالش بک‌تست و چالش معامله — همه در یکجا
              </p>
            </div>
          </div>
        </section>

        {/* Capability cards */}
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <div
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
            dir="rtl"
          >
            <CapabilityCard
              href={user ? "/dashboard/trades/upload" : "/auth/login"}
              accent="emerald"
              visual={<VisualJournal />}
              title="بارگذاری و تحلیل معاملات"
              description="فایل MT5 یا Excel را وارد کنید تا وین‌ریت، سود/زیان، تقویم و نمودارهای عملکرد برایتان ساخته شود."
              cta={user ? "بارگذاری فایل" : "ورود و شروع"}
              footer={
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-emerald-300/90">
                  <button
                    type="button"
                    onClick={() => setShowMt5Guide(true)}
                    className="hover:text-emerald-200 underline underline-offset-2"
                  >
                    راهنمای MT5
                  </button>
                  <a
                    href="/api/templates/download?type=sample"
                    download
                    className="hover:text-emerald-200"
                  >
                    نمونه Excel
                  </a>
                  <a
                    href="/api/templates/download?type=sample&format=csv"
                    download
                    className="hover:text-emerald-200"
                  >
                    CSV
                  </a>
                </div>
              }
            />

            <CapabilityCard
              href="/tools"
              accent="cyan"
              visual={<VisualTools />}
              title="ابزار معامله"
              description="ساعت سشن‌ها، همپوشانی بازارها، ماشین‌حساب ریسک و پیپ، و راهنمای جفت‌ارز."
              cta="مشاهده ابزارها"
            />

            <CapabilityCard
              href="/backtest"
              accent="amber"
              visual={<VisualBacktest />}
              title="بک‌تست"
              description="ثبت بک‌تست روزانه، گزارش TP/SL، عملکرد ستاپ‌ها و نمودارهای تحلیلی در تقویم."
              cta="شروع بک‌تست"
            />
          </div>

          <div className="max-w-5xl mx-auto mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" dir="rtl">
            <MiniCapability
              href="/blog"
              title="بلاگ"
              subtitle="آموزش ژورنال و بک‌تست"
            />
            <MiniCapability
              href="/leaderboards"
              title="لیدربورد"
              subtitle="رتبه وین‌ریت و سود"
            />
            <MiniCapability
              href={user ? "/dashboard" : "/auth/login"}
              title="ژورنال"
              subtitle="تقویم و پلن روزانه"
            />
            <MiniCapability
              href="/tools/risk-calculator"
              title="ریسک"
              subtitle="حجم معامله"
            />
            <MiniCapability
              href="/tools/market-clock"
              title="ساعت بازار"
              subtitle="سشن‌های جهانی"
            />
          </div>
        </section>

        {/* Challenges highlight */}
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <div
            className="max-w-5xl mx-auto relative overflow-hidden rounded-2xl md:rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 via-gray-900/80 to-amber-950/30"
            dir="rtl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.2),_transparent_55%)]" />
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6 md:mb-8">
                <div className="max-w-xl">
                  <p className="text-emerald-400 text-xs font-semibold tracking-wide mb-2">
                    ویژگی جدید
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    چالش بک‌تست / چالش معامله
                  </h2>
                  <p className="mt-2 text-sm md:text-base text-gray-300 leading-relaxed">
                    هدف چالش‌ها شناسایی نقاط ضعف و قوت و تحلیل آن‌هاست — نه رتبه‌بندی.
                    بک‌تست تاریخی یا معاملات واقعی را کنار هم ببینید و الگوهای عملکرد را کشف کنید.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link
                    href={
                      user
                        ? "/challenges/new"
                        : "/auth/login?next=/challenges/new"
                    }
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                  >
                    ایجاد چالش
                  </Link>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const p = new URLSearchParams();
                  if (homeChallengeQ.trim()) p.set("q", homeChallengeQ.trim());
                  if (homeChallengeType) p.set("type", homeChallengeType);
                  if (homeChallengeAccess) p.set("access", homeChallengeAccess);
                  const qs = p.toString();
                  router.push(`/challenges/browse${qs ? `?${qs}` : ""}`);
                }}
                className="mb-6 md:mb-8 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-[11px] text-gray-400 mb-1">
                      جستجو در چالش‌ها
                    </label>
                    <input
                      value={homeChallengeQ}
                      onChange={(e) => setHomeChallengeQ(e.target.value)}
                      placeholder="عنوان، توضیح یا نماد…"
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">نوع</label>
                    <select
                      value={homeChallengeType}
                      onChange={(e) => setHomeChallengeType(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white"
                    >
                      <option value="" className="text-gray-900">همه انواع</option>
                      <option value="backtest" className="text-gray-900">چالش بک‌تست</option>
                      <option value="trade" className="text-gray-900">چالش معامله</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">دسترسی</label>
                    <select
                      value={homeChallengeAccess}
                      onChange={(e) => setHomeChallengeAccess(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white"
                    >
                      <option value="" className="text-gray-900">همه</option>
                      <option value="public" className="text-gray-900">عمومی (بدون تایید)</option>
                      <option value="private" className="text-gray-900">خصوصی (با تایید)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                  >
                    مشاهده چالش‌ها
                  </button>
                  <p className="text-[11px] text-gray-500">
                    لیست کامل چالش‌ها با فیلتر عمومی/خصوصی و درخواست پیوستن
                  </p>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <ChallengePromoCard
                  title="چالش بک‌تست"
                  description="تحلیل بک‌تست‌های چارت تاریخی برای پیدا کردن ضعف و قوت ستاپ‌ها، جهت و سشن‌ها."
                  icon="invite"
                />
                <ChallengePromoCard
                  title="چالش معامله"
                  description="تحلیل معاملات واقعی در بازه مشخص — معمولاً آینده — با ثبت نتیجه در ژورنال."
                  icon="race"
                />
                <ChallengePromoCard
                  title="جدول تحلیل"
                  description="کنار هم دیدن Hit Rate، سود/زیان، Buy/Sell و ستاپ‌ها برای یادگیری — نه رتبه‌بندی."
                  icon="table"
                />
              </div>

              {openChallenges.length > 0 && (
                <div className="mt-6 md:mt-8">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-white/90">
                      چالش‌های فعال
                    </h3>
                    <Link
                      href="/challenges/browse"
                      className="text-xs text-emerald-300 hover:text-emerald-200 font-medium"
                    >
                      مشاهده همه ←
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {openChallenges.slice(0, 4).map((c) => (
                      <Link
                        key={c._id}
                        href={`/challenges/${c.inviteCode}`}
                        className="rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 hover:border-emerald-400/30 px-4 py-3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-white text-sm leading-snug">
                            {c.title}
                          </p>
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
                              c.requireApproval
                                ? "bg-amber-500/15 text-amber-200 border-amber-400/20"
                                : "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
                            }`}
                          >
                            {c.requireApproval ? "خصوصی" : "عمومی"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {c.type === "trade" ? "چالش معامله" : "چالش بک‌تست"}
                          {" · "}نماد{" "}
                          <span className="text-emerald-300 font-semibold">
                            {c.symbol}
                          </span>
                          {" · "}هر روز ≥ ۱
                          {c.type === "trade" ? " معامله" : " بک‌تست"}
                          {c.approvedCount != null
                            ? ` · ${c.approvedCount} نفر`
                            : ""}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <Modal
          isOpen={showMt5Guide}
          onClose={() => setShowMt5Guide(false)}
          title="راهنمای خروجی از MT5"
          size="lg"
        >
          <div className="space-y-3" dir="rtl">
            <p className="text-sm text-gray-600 leading-relaxed">
              در MetaTrader ۵ از Toolbox به تب History بروید، راست‌کلیک کنید و
              Report ← Open XML را بزنید.
            </p>
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <Image
                src="/guides/mt5-history-export-guide.png"
                alt="آموزش خروجی History در MetaTrader 5"
                width={1280}
                height={720}
                className="w-full h-auto"
                sizes="(max-width: 640px) 100vw, 640px"
              />
            </div>
          </div>
        </Modal>

        {/* Leaderboards */}
        <section className="container mx-auto px-4 pb-14 md:pb-20">
          <div className="flex items-end justify-between gap-3 mb-5 md:mb-8 max-w-5xl mx-auto" dir="rtl">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              برترین‌ها
            </h2>
            <Link
              href="/leaderboards"
              className="text-sm text-primary-300 hover:text-primary-200 shrink-0"
            >
              همه لیست‌ها
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 max-w-5xl mx-auto">
            <HomeLeaderboardCard
              title="وین‌ریت سال"
              minTrades={220}
              loading={boardsLoading}
              board={homeBoards?.winrate?.year}
            />
            <HomeLeaderboardCard
              title="وین‌ریت ماه"
              minTrades={20}
              loading={boardsLoading}
              board={homeBoards?.winrate?.month}
            />
            <HomeLeaderboardCard
              title="وین‌ریت هفته"
              minTrades={5}
              loading={boardsLoading}
              board={homeBoards?.winrate?.week}
            />
          </div>
        </section>

        {/* Support */}
        <section
          id="support"
          className="container mx-auto px-4 pb-14 md:pb-20 scroll-mt-8"
        >
          <div
            className="max-w-2xl mx-auto rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 md:p-7"
            dir="rtl"
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              نظر یا پیشنهاد
            </h2>
            <p className="text-sm text-gray-400 text-center mb-5">
              سایت در حال توسعه است — بازخوردتان را بفرستید
            </p>

            {supportReason === "inactive" && (
              <div className="mb-5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm text-center">
                حساب شما غیرفعال است. دسته «فعال‌سازی کاربری» را انتخاب کنید.
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
              submitLabel="ارسال"
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
      </div>
    </main>
  );
}

function NavIcon({ path }) {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={path}
      />
    </svg>
  );
}

const ACCENT = {
  emerald: {
    border: "border-emerald-400/25 hover:border-emerald-300/45",
    glow: "from-emerald-500/20 via-transparent to-transparent",
    btn: "bg-emerald-600 hover:bg-emerald-500 text-white",
    chip: "bg-emerald-500/15 text-emerald-300",
  },
  cyan: {
    border: "border-cyan-400/25 hover:border-cyan-300/45",
    glow: "from-cyan-500/20 via-transparent to-transparent",
    btn: "bg-cyan-600 hover:bg-cyan-500 text-white",
    chip: "bg-cyan-500/15 text-cyan-300",
  },
  amber: {
    border: "border-amber-400/25 hover:border-amber-300/45",
    glow: "from-amber-500/20 via-transparent to-transparent",
    btn: "bg-amber-600 hover:bg-amber-500 text-white",
    chip: "bg-amber-500/15 text-amber-300",
  },
};

function CapabilityCard({
  href,
  accent,
  visual,
  title,
  description,
  cta,
  footer,
}) {
  const a = ACCENT[accent] || ACCENT.emerald;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/[0.06] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09] ${a.border}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-bl ${a.glow} opacity-80`}
      />
      <Link href={href} className="relative block h-28 md:h-32 overflow-hidden border-b border-white/10">
        {visual}
      </Link>
      <div className="relative flex flex-1 flex-col p-4 md:p-5 text-right">
        <Link href={href} className="block">
          <h2 className="text-base md:text-lg font-bold text-white mb-2 leading-snug group-hover:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {description}
          </p>
        </Link>
        <Link
          href={href}
          className={`inline-flex items-center justify-center w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${a.btn}`}
        >
          {cta}
        </Link>
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}

function MiniCapability({ href, title, subtitle }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3.5 text-center hover:bg-white/[0.08] hover:border-white/20 transition-colors"
    >
      <div className="text-white font-bold text-sm">{title}</div>
      <div className="text-[11px] text-gray-500 mt-1">{subtitle}</div>
    </Link>
  );
}

function ChallengePromoCard({ title, description, icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 md:p-5">
      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center mb-3 text-emerald-300">
        {icon === "invite" && (
          <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
        {icon === "race" && (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )}
        {icon === "table" && (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 6v12M14 6v12M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
          </svg>
        )}
      </div>
      <h3 className="text-white font-bold text-sm md:text-base mb-1.5">{title}</h3>
      <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

/** Candlestick + equity curve visual */
function VisualJournal() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 to-gray-950">
      <svg
        viewBox="0 0 320 128"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {[32, 64, 96].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="320"
            y2={y}
            stroke="rgba(255,255,255,0.06)"
          />
        ))}
        {/* equity area */}
        <path
          d="M0 100 L40 92 L80 78 L120 84 L160 58 L200 48 L240 36 L280 28 L320 22 L320 128 L0 128 Z"
          fill="url(#eqFill)"
        />
        <path
          d="M0 100 L40 92 L80 78 L120 84 L160 58 L200 48 L240 36 L280 28 L320 22"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* candles */}
        {[
          [48, 70, 88, 1],
          [88, 55, 75, 1],
          [128, 62, 90, 0],
          [168, 40, 68, 1],
          [208, 35, 55, 1],
          [248, 28, 48, 1],
          [288, 22, 42, 0],
        ].map(([x, open, close, up], i) => {
          const top = Math.min(open, close);
          const h = Math.abs(close - open) || 8;
          const color = up ? "#10b981" : "#f43f5e";
          return (
            <g key={i}>
              <line
                x1={x}
                y1={top - 10}
                x2={x}
                y2={top + h + 10}
                stroke={color}
                strokeWidth="1.5"
                opacity="0.7"
              />
              <rect
                x={x - 5}
                y={top}
                width="10"
                height={h}
                rx="1"
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      <span className="absolute bottom-2 left-3 text-[10px] font-medium text-emerald-300/80 tracking-wide">
        CHART · ANALYSIS
      </span>
    </div>
  );
}

/** Market sessions / clocks */
function VisualTools() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 to-gray-950">
      <svg
        viewBox="0 0 320 128"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[40, 80, 120, 160, 200, 240, 280].map((x) => (
          <line
            key={x}
            x1={x}
            y1="16"
            x2={x}
            y2="112"
            stroke="rgba(34,211,238,0.08)"
          />
        ))}
        {/* session bands */}
        <rect x="24" y="36" width="90" height="22" rx="6" fill="#22d3ee" opacity="0.2" />
        <rect x="90" y="58" width="100" height="22" rx="6" fill="#38bdf8" opacity="0.25" />
        <rect x="160" y="42" width="110" height="22" rx="6" fill="#818cf8" opacity="0.28" />
        <rect x="210" y="70" width="85" height="22" rx="6" fill="#34d399" opacity="0.22" />
        {/* clock ring */}
        <circle cx="268" cy="36" r="18" fill="none" stroke="#67e8f9" strokeWidth="2" opacity="0.7" />
        <line x1="268" y1="36" x2="268" y2="26" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
        <line x1="268" y1="36" x2="278" y2="40" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-2 left-3 text-[10px] font-medium text-cyan-300/80 tracking-wide">
        SESSIONS · RISK
      </span>
    </div>
  );
}

/** Backtest TP/SL bars */
function VisualBacktest() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 to-gray-950">
      <svg
        viewBox="0 0 320 128"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[28, 56, 84].map((y) => (
          <line
            key={y}
            x1="24"
            y1={y}
            x2="296"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}
        {[
          [48, 70, 28],
          [96, 52, 36],
          [144, 40, 22],
          [192, 58, 30],
          [240, 34, 18],
          [288, 46, 26],
        ].map(([x, tp, sl], i) => (
          <g key={i}>
            <rect x={x - 8} y={100 - tp} width="8" height={tp} rx="2" fill="#10b981" opacity="0.9" />
            <rect x={x + 2} y={100 - sl} width="8" height={sl} rx="2" fill="#f43f5e" opacity="0.85" />
          </g>
        ))}
        <path
          d="M40 88 L88 72 L136 64 L184 76 L232 54 L280 60"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      <span className="absolute bottom-2 left-3 text-[10px] font-medium text-amber-300/80 tracking-wide">
        TP / SL · SETUPS
      </span>
    </div>
  );
}

function formatWinRate(value) {
  return `${Number(value).toFixed(1)}%`;
}

function HomeLeaderboardCard({ title, minTrades, board, loading }) {
  const topTraders = (board?.entries || []).slice(0, 3);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/15 text-right" dir="rtl">
      <h3 className="text-base md:text-lg font-bold text-white">{title}</h3>
      <p className="text-[11px] text-gray-500 mb-3">حداقل {minTrades} معامله</p>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : topTraders.length === 0 ? (
        <p className="text-gray-500 text-center text-xs py-3">بدون داده</p>
      ) : (
        <div className="space-y-2">
          {topTraders.map((trader) => (
            <div
              key={trader.rank}
              className="flex items-center justify-between bg-white/5 rounded-lg px-2.5 py-2 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
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
                      className="text-sm text-white truncate hover:text-primary-300"
                    >
                      {trader.publicName || "کاربر"}
                    </Link>
                  ) : (
                    <span className="text-sm text-white truncate">
                      {trader.publicName || "کاربر"}
                    </span>
                  )}
                  {trader.verified && (
                    <VerifiedBadge className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
              </div>
              <span className="text-emerald-400 font-bold text-sm shrink-0">
                {formatWinRate(trader.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
