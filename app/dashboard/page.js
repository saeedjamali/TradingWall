"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import PlanModal from "@/components/PlanModal";
import MonthlyChart from "@/components/MonthlyChart";
import YearlyMonthlyChart from "@/components/YearlyMonthlyChart";
import YearlyFinanceCharts from "@/components/YearlyFinanceCharts";
import EquityDrawdownChart from "@/components/EquityDrawdownChart";
import DashboardChartBoard from "@/components/DashboardChartBoard";
import DashboardPresentation from "@/components/DashboardPresentation";
import BuySellChart from "@/components/BuySellChart";
import WinRateTrendChart from "@/components/WinRateTrendChart";
import DisciplineResultChart from "@/components/DisciplineResultChart";
import SetupPerformanceChart from "@/components/SetupPerformanceChart";
import DayTradesModal from "@/components/DayTradesModal";
import MonthPlansListModal from "@/components/MonthPlansListModal";
import PreTradeChecklist from "@/components/PreTradeChecklist";
import FileUploadCard from "@/components/FileUploadCard";
import { UserName } from "@/components/VerifiedBadge";
import AppTopNav from "@/components/AppTopNav";
import { useInboxCounts } from "@/components/useInboxCounts";
import { checkPlanCompliance, getPlanForDate } from "@/utils/planCompliance";
import { getSessionUser } from "@/utils/session";
import { monthLocalBounds, yearLocalBounds } from "@/utils/dateHelpers";

const STATS_PERIOD_KEY = "tw_dashboard_stats_period";
const STATS_PERIODS = [
  { id: "month", label: "ماهانه" },
  { id: "year", label: "سالانه" },
  { id: "all", label: "کلی" },
];

function readStatsPeriod() {
  try {
    const saved = localStorage.getItem(STATS_PERIOD_KEY);
    if (saved === "month" || saved === "year" || saved === "all") return saved;
  } catch {
    // ignore storage errors
  }
  return "month";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthTrades, setMonthTrades] = useState([]);
  const [yearTrades, setYearTrades] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showMonthPlans, setShowMonthPlans] = useState(false);
  const [calendarNatural, setCalendarNatural] = useState(0);
  const [presentationSlide, setPresentationSlide] = useState(null);
  const [presentationZoom, setPresentationZoom] = useState(1);
  const [calendarSlot, setCalendarSlot] = useState(null);
  const calendarWrapRef = useRef(null);
  const calendarCardRef = useRef(null);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const { userUnread, adminInbox } = useInboxCounts({
    userId: user?.id,
    isAdmin: user?.role === "admin",
  });

  useEffect(() => {
    const parsedUser = getSessionUser();
    if (!parsedUser) {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    setStatsPeriod(readStatsPeriod());
    try {
      localStorage.removeItem("tw_dashboard_calendar_zoom");
    } catch {
      // ignore storage errors
    }
    checkProfileReminder(parsedUser.id);
  }, [router]);

  const checkProfileReminder = async (userId) => {
    let dismissed = false;
    try {
      dismissed =
        localStorage.getItem(`tw_dismiss_profile_reminder_${userId}`) === "1";
    } catch {
      // Continue and determine visibility from the saved profile.
    }

    if (dismissed) {
      setShowProfileReminder(false);
      return;
    }

    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        setShowProfileReminder(true);
        return;
      }

      const profile = data.user || {};
      const publicName = String(profile.publicName || "").trim();
      const hasCustomPublicName =
        Boolean(publicName) &&
        publicName !== "کاربر جدید" &&
        !/^کاربر \d{4}$/.test(publicName);
      const profileIsComplete = Boolean(
        hasCustomPublicName &&
          String(profile.profileImage || "").trim() &&
          String(profile.city || "").trim(),
      );
      setShowProfileReminder(!profileIsComplete);
    } catch (error) {
      console.error("Error checking profile completion:", error);
      setShowProfileReminder(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    router.push("/");
  };

  const dismissProfileReminder = () => {
    if (user?.id) {
      localStorage.setItem(`tw_dismiss_profile_reminder_${user.id}`, "1");
    }
    setShowProfileReminder(false);
  };

  useEffect(() => {
    if (user) {
      fetchMonthTrades(user.id);
    }
  }, [currentMonth, user]);

  useEffect(() => {
    if (user) {
      fetchYearTrades(user.id);
    }
  }, [user, currentMonth.getFullYear()]);

  useEffect(() => {
    if (!user?.id) return;
    fetchStats(user.id, statsPeriod, currentMonth);
  }, [user?.id, statsPeriod, currentMonth]);

  const changeStatsPeriod = (period) => {
    setStatsPeriod(period);
    try {
      localStorage.setItem(STATS_PERIOD_KEY, period);
    } catch {
      // ignore storage errors
    }
  };

  const fetchStats = async (userId, period = statsPeriod, month = currentMonth) => {
    try {
      const params = new URLSearchParams({ userId });
      if (period === "month") {
        const { start, end } = monthLocalBounds(
          month.getFullYear(),
          month.getMonth(),
        );
        params.set("startDate", start.toISOString());
        params.set("endDate", end.toISOString());
      } else if (period === "year") {
        const { start, end } = yearLocalBounds(month.getFullYear());
        params.set("startDate", start.toISOString());
        params.set("endDate", end.toISOString());
      }

      const response = await fetch(`/api/trades/stats?${params}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthTrades = async (userId) => {
    try {
      const { start, end } = monthLocalBounds(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
      );

      const response = await fetch(
        `/api/trades?userId=${userId}&startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}&limit=1000`,
      );
      const data = await response.json();

      if (data.success) {
        setMonthTrades(data.trades || []);
      }
    } catch (error) {
      console.error("Error fetching month trades:", error);
    }
  };

  const fetchYearTrades = async (userId) => {
    try {
      const { start, end } = yearLocalBounds(currentMonth.getFullYear());
      const response = await fetch(
        `/api/trades?userId=${userId}&startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}&limit=5000`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (data.success) {
        setYearTrades(data.trades || []);
      }
    } catch (error) {
      console.error("Error fetching year trades:", error);
    }
  };

  const handleExportCalendar = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      // Get calendar and chart elements
      const calendarElement =
        calendarCardRef.current ||
        document.querySelector(".calendar-export-section");

      if (calendarElement) {
        const wrap = calendarWrapRef.current;
        const previousTransform = calendarElement.style.transform;
        const previousWidth = calendarElement.style.width;
        const previousHeight = wrap?.style.height;
        const previousOverflow = wrap?.style.overflow;
        calendarElement.style.transform = "none";
        calendarElement.style.width = "100%";
        if (wrap) {
          wrap.style.height = "auto";
          wrap.style.overflow = "visible";
        }
        try {
          const canvas = await html2canvas(calendarElement, {
            backgroundColor: "#f9fafb",
            scale: 2,
            logging: false,
            useCORS: true,
          });

          const link = document.createElement("a");
          const monthName = monthNames[currentMonth.getMonth()];
          const year = currentMonth.getFullYear();
          link.download = `trading-calendar-${monthName}-${year}.png`;
          link.href = canvas.toDataURL();
          link.click();
        } finally {
          calendarElement.style.transform = previousTransform;
          calendarElement.style.width = previousWidth;
          if (wrap) {
            wrap.style.height = previousHeight || "";
            wrap.style.overflow = previousOverflow || "";
          }
        }
      }
    } catch (error) {
      console.error("Error exporting calendar:", error);
      alert("خطا در دانلود تصویر");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <Loading text="در حال بارگذاری داشبورد..." />;
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const calendarNode = (
          <div
            ref={calendarWrapRef}
            className={presentationSlide == null ? "mb-4" : "w-full overflow-hidden"}
            style={
              presentationSlide != null
                ? {
                    height: calendarNatural
                      ? Math.round(calendarNatural * presentationZoom)
                      : undefined,
                    width: "min(100%, 72rem)",
                  }
                : undefined
            }
          >
          <div
            ref={calendarCardRef}
            className="calendar-export-section rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primary-50/40 shadow-md p-3 md:p-4 text-slate-800"
            style={
              presentationSlide != null
                ? {
                    transform: `scale(${presentationZoom})`,
                    transformOrigin: "top center",
                  }
                : undefined
            }
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowMonthPlans(true)}
                className="p-1.5 md:px-3 md:py-1.5 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1.5 text-xs shrink-0"
                title="مشاهده پلن‌های این ماه"
              >
                <span>📋</span>
                <span className="hidden sm:inline">پلن‌ها</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 min-w-0">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  title="ماه بعد"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="px-3 py-1 bg-white border border-primary-200 rounded-md text-center min-w-[9.5rem]">
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">تقویم معاملاتی</div>
                  <div className="text-sm font-bold text-primary-800 leading-tight">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  title="ماه قبل"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {presentationSlide == null && (
                  <button
                    type="button"
                    onClick={() => setPresentationSlide(0)}
                    className="p-1.5 md:px-3 md:py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs"
                    title="تقویم تمام‌صفحه؛ بعد، نمودارها یکی‌یکی"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4" />
                    </svg>
                    <span className="hidden sm:inline">تمام‌صفحه</span>
                  </button>
                )}
                <a
                  href="#quick-actions"
                  title="رفتن به بارگذاری فایل معامله"
                  className="p-1.5 md:px-3 md:py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="hidden sm:inline">معامله</span>
                </a>
                <button
                  onClick={handleExportCalendar}
                  disabled={isExporting}
                  className="p-1.5 md:px-3 md:py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="دانلود تصویر تقویم"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden md:inline">
                    {isExporting ? "..." : "تصویر"}
                  </span>
                </button>
              </div>
            </div>

            <div
              dir="rtl"
              className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] text-slate-600"
            >
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />سود</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300" />ضرر</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />سر به سر</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-50 border border-slate-200" />بدون معامله</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200/80 border border-slate-300" />تعطیل</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border-2 border-primary-400" />با پلن</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border-2 border-orange-400" />بدون پلن</span>
              <span className="basis-full text-sky-800">
                کلیک روی هر روز برای ثبت پلن معاملاتی · دکمه مشاهده یا چشم برای ثبت ستاپ
              </span>
            </div>

            {/* Calendar Grid */}
            <TradingCalendar
              currentMonth={currentMonth}
              userId={user?.id}
              monthTrades={monthTrades}
              onTradeUpdated={(tradeId, patch) => {
                setMonthTrades((prev) =>
                  (prev || []).map((t) =>
                    t._id === tradeId ? { ...t, ...patch } : t,
                  ),
                );
                setYearTrades((prev) =>
                  (prev || []).map((t) =>
                    t._id === tradeId ? { ...t, ...patch } : t,
                  ),
                );
                fetchStats(user.id, statsPeriod, currentMonth);
              }}
            />
          </div>
          </div>
  );

  const chartItems = [
              {
                id: "daily",
                title: "عملکرد روزانه",
                description: "تعداد معاملات موفق و ناموفق هر روز این ماه، همراه با برایند دلاری.",
                render: () => (
                  <MonthlyChart trades={monthTrades} currentMonth={currentMonth} />
                ),
              },
              {
                id: "buysell",
                title: "خرید و فروش",
                description: "مقایسه معاملات Buy و Sell این ماه و اینکه هر کدام چقدر موفق بوده‌اند.",
                render: () => (
                  <BuySellChart trades={monthTrades} currentMonth={currentMonth} />
                ),
              },
              {
                id: "yearly",
                title: "عملکرد ماهانه سال",
                description: "مقایسه دوازده ماه از نظر تعداد معاملات موفق، ناموفق و برایند دلاری.",
                render: () => (
                  <YearlyMonthlyChart trades={yearTrades} currentMonth={currentMonth} />
                ),
              },
              {
                id: "pnl",
                title: "سود و زیان دلاری",
                description: "برایند دلاری هر ماه؛ ستون سبز یعنی ماه سودده و ستون قرمز یعنی ماه ضررده.",
                render: () => (
                  <YearlyFinanceCharts trades={yearTrades} currentMonth={currentMonth} part="pnl" />
                ),
              },
              {
                id: "year-winrate",
                title: "وین‌ریت ماهانه",
                description: "درصد معاملات موفق هر ماه سال. ماه بدون معامله در نمودار خالی می‌ماند.",
                render: () => (
                  <YearlyFinanceCharts trades={yearTrades} currentMonth={currentMonth} part="winrate" />
                ),
              },
              {
                id: "equity",
                title: "منحنی سرمایه",
                description: "جمع سود، کمیسیون و سواپ از ابتدای سال، و فاصله سرمایه تا آخرین سقف.",
                render: () => (
                  <EquityDrawdownChart trades={yearTrades} currentMonth={currentMonth} />
                ),
              },
              {
                id: "winrate",
                title: "روند وین‌ریت",
                description: "درصد موفقیت از ابتدای ماه تا هر روز، به‌علاوه نتیجه همان روز.",
                render: () => (
                  <WinRateTrendChart trades={monthTrades} currentMonth={currentMonth} />
                ),
              },
              {
                id: "discipline",
                title: "انضباط و نتیجه",
                description: "مقایسه روزهای منظم، نامنظم و بدون پلن با سود و زیان همان روزها.",
                render: () => (
                  <DisciplineResultChart
                    trades={monthTrades}
                    currentMonth={currentMonth}
                    userId={user?.id}
                  />
                ),
              },
              {
                id: "setups",
                title: "گزارش ستاپ‌ها",
                description: "تعداد برد و باخت و وین‌ریت هر ستاپ در ماه انتخاب‌شده.",
                render: () => (
                  <SetupPerformanceChart trades={monthTrades} currentMonth={currentMonth} />
                ),
              },
  ];

  return (
    <div className="page-shell">
      {/* Header — same dark shell language as homepage */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity min-w-0"
              >
                <Image
                  src="/logo/tradinggwall-logo-horizontal.svg"
                  alt="Trading Wall"
                  width={519}
                  height={163}
                  priority
                  className="h-8 md:h-11 w-auto max-w-[160px] md:max-w-[220px]"
                />
              </Link>
              <span className="text-white/30 hidden md:inline">|</span>
              <UserName
                name={user?.publicName}
                verified={user?.verified}
                className="hidden md:inline text-white/80 max-w-[140px]"
                badgeClassName="w-4 h-4 text-blue-400"
              />
            </div>

            <AppTopNav
              isAdmin={user?.role === "admin"}
              onLogout={handleLogout}
              userId={user?.id}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {(userUnread > 0 || (user?.role === "admin" && adminInbox > 0)) && (
          <div className="mb-4 space-y-2" dir="rtl">
            {userUnread > 0 && (
              <Link
                href="/profile?tab=messages"
                className="flex items-center justify-between gap-3 rounded-lg border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-xs sm:text-sm text-sky-100 hover:bg-sky-500/25"
              >
                <span>
                  {userUnread} پیام جدید دارید — برای مشاهده کلیک کنید
                </span>
                <span className="shrink-0 font-semibold">پیام‌ها ←</span>
              </Link>
            )}
            {user?.role === "admin" && adminInbox > 0 && (
              <Link
                href="/admin/messages"
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-xs sm:text-sm text-amber-100 hover:bg-amber-500/25"
              >
                <span>
                  {adminInbox} نظر یا تیکت جدید در پنل ادمین
                </span>
                <span className="shrink-0 font-semibold">مشاهده ←</span>
              </Link>
            )}
          </div>
        )}

        {showProfileReminder && user && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-100"
            dir="rtl"
          >
            <Link
              href="/profile"
              className="hover:text-white underline-offset-2 hover:underline min-w-0"
            >
              پروفایل را یک‌بار بررسی کنید — نام نمایشی، تصویر و شهر را می‌توانید ویرایش کنید.
            </Link>
            <button
              type="button"
              onClick={dismissProfileReminder}
              className="shrink-0 rounded-md px-2 py-0.5 text-amber-200/80 hover:text-white hover:bg-white/10"
              aria-label="بستن یادآوری"
            >
              بستن
            </button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2" dir="rtl">
          <p className="text-xs sm:text-sm text-white/70">
            {statsPeriod === "month"
              ? `آمار ماه ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
              : statsPeriod === "year"
                ? `آمار سال ${currentMonth.getFullYear()}`
                : "آمار کلی همه معاملات"}
          </p>
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 p-0.5">
            {STATS_PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeStatsPeriod(item.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                  statsPeriod === item.id
                    ? "bg-white text-slate-800"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-8">
          <StatCard
            title="تعداد معاملات"
            value={stats?.totalTrades || 0}
            icon="📊"
            accent="sky"
          />
          <StatCard
            title="وین ریت"
            value={stats ? `${stats.winRate}%` : "0%"}
            icon="🎯"
            accent="teal"
          />
          <StatCard
            title="سود/زیان کل"
            value={stats ? `$${stats.totalProfitLoss.toFixed(2)}` : "$0"}
            icon="💰"
            accent={
              stats
                ? stats.totalProfitLoss > 0
                  ? "profit"
                  : stats.totalProfitLoss < 0
                    ? "loss"
                    : "sky"
                : "sky"
            }
            valueTone={
              stats
                ? stats.totalProfitLoss > 0
                  ? "profit"
                  : stats.totalProfitLoss < 0
                    ? "loss"
                    : "neutral"
                : "neutral"
            }
          />
          <StatCard
            title="میانگین سود"
            value={stats ? `$${stats.averageProfit.toFixed(2)}` : "$0"}
            icon="📈"
            accent={
              stats
                ? stats.averageProfit > 0
                  ? "profit"
                  : stats.averageProfit < 0
                    ? "loss"
                    : "cyan"
                : "cyan"
            }
            valueTone={
              stats
                ? stats.averageProfit > 0
                  ? "profit"
                  : stats.averageProfit < 0
                    ? "loss"
                    : "neutral"
                : "neutral"
            }
          />
        </div>

        {/* Calendar and Chart Export Section */}
        <div>
          {/* Calendar Header */}
          {/* Pre-Trade Checklist */}
          {user && (
            <div className="mb-3">
              <PreTradeChecklist userId={user.id} />
            </div>
          )}

          {presentationSlide == null
            ? calendarNode
            : calendarSlot
              ? createPortal(calendarNode, calendarSlot)
              : null}

          {presentationSlide != null && (
            <DashboardPresentation
              slide={presentationSlide}
              charts={chartItems}
              onSlide={setPresentationSlide}
              onClose={() => setPresentationSlide(null)}
              onCalendarSlot={setCalendarSlot}
              onCalendarZoom={(zoom, natural) => {
                setPresentationZoom((prev) => (Math.abs(prev - zoom) < 0.008 ? prev : zoom));
                setCalendarNatural((prev) => (prev === natural ? prev : natural));
              }}
            />
          )}

          <MonthPlansListModal
            isOpen={showMonthPlans}
            onClose={() => setShowMonthPlans(false)}
            userId={user?.id}
            currentMonth={currentMonth}
          />

          <DashboardChartBoard items={chartItems} />
        </div>
        {/* End Export Section */}

        {/* Quick Actions */}
        <div
          id="quick-actions"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 scroll-mt-24"
        >
          {user && (
            <FileUploadCard
              userId={user.id}
              compact={true}
              onUploadSuccess={() => {
                fetchMonthTrades(user.id);
                fetchYearTrades(user.id);
                fetchStats(user.id, statsPeriod, currentMonth);
              }}
            />
          )}
          <QuickActionCard
            title="Add New Trade"
            description="ثبت معامله به صورت دستی"
            icon="➕"
            href="/dashboard/trades/new"
          />
          <QuickActionCard
            title="Upload Page"
            description="صفحه کامل آپلود"
            icon="📤"
            href="/dashboard/trades/upload"
          />
          <QuickActionCard
            title="View All Trades"
            description="مشاهده لیست کامل معاملات"
            icon="📊"
            href="/dashboard/trades"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, accent = "sky", valueTone = "neutral" }) {
  const tooltips = {
    "تعداد معاملات": "Total Trades",
    "وین ریت": "Win Rate - درصد معاملات سودده",
    "سود/زیان کل": "Total Profit/Loss",
    "میانگین سود": "Average Profit per Trade",
  };

  const accents = {
    sky: {
      card: "from-sky-50 via-white to-primary-100 border-primary-200/80",
      bar: "bg-primary-500",
      icon: "bg-primary-100",
    },
    teal: {
      card: "from-teal-50 via-white to-emerald-50 border-teal-200/80",
      bar: "bg-teal-500",
      icon: "bg-teal-100",
    },
    cyan: {
      card: "from-cyan-50 via-white to-sky-50 border-cyan-200/80",
      bar: "bg-cyan-500",
      icon: "bg-cyan-100",
    },
    profit: {
      card: "from-emerald-50 via-white to-green-50 border-emerald-200/80",
      bar: "bg-emerald-500",
      icon: "bg-emerald-100",
    },
    loss: {
      card: "from-rose-50 via-white to-red-50 border-rose-200/80",
      bar: "bg-rose-500",
      icon: "bg-rose-100",
    },
  };

  const theme = accents[accent] || accents.sky;

  const valueClass =
    valueTone === "profit"
      ? "text-profit"
      : valueTone === "loss"
        ? "text-loss"
        : "text-gray-900";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br px-3 py-3.5 sm:p-5 shadow-md h-full ${theme.card}`}
      title={tooltips[title]}
    >
      <div className={`absolute inset-y-0 right-0 w-1 ${theme.bar}`} />
      <div className="flex items-center gap-2.5 sm:gap-3 pr-1.5 sm:pr-2 h-full">
        <div
          className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg text-lg sm:text-2xl ${theme.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <p className="text-[11px] sm:text-sm text-gray-600 leading-tight truncate">
            {title}
          </p>
          <p
            className={`mt-0.5 sm:mt-1 text-base sm:text-2xl font-bold tabular-nums leading-none tracking-tight ${valueClass}`}
          >
            <span dir="ltr" className="inline-block">
              {value}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function TradingCalendar({
  currentMonth,
  userId,
  monthTrades = [],
  onTradeUpdated,
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [coveringPlan, setCoveringPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [selectedDayTrades, setSelectedDayTrades] = useState([]);

  useEffect(() => {
    fetchMonthData();
  }, [currentMonth, userId]);

  const fetchMonthData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch plans for the month
      const plansResponse = await fetch(`/api/plans?userId=${userId}`);
      const plansData = await plansResponse.json();

      if (plansData.success) {
        setPlans(plansData.plans || []);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (date, dayTrades) => {
    // Don't allow plan creation for weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return; // Don't open modal for weekends
    }

    setSelectedDate(date);

    // Only look for daily plan for this specific date
    const dailyPlan = plans.find((plan) => {
      const planDate = new Date(plan.date);
      return (
        planDate.getDate() === date.getDate() &&
        planDate.getMonth() === date.getMonth() &&
        planDate.getFullYear() === date.getFullYear() &&
        plan.period === "daily"
      );
    });

    // Check if there's a weekly/monthly plan covering this date (for info only)
    let coveringWeeklyMonthly = null;

    if (!dailyPlan) {
      // Check for weekly plan
      coveringWeeklyMonthly = plans.find((plan) => {
        if (plan.period !== "weekly") return false;

        const planDate = new Date(plan.date);
        const weekStart = new Date(planDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return date >= weekStart && date <= weekEnd;
      });

      // Check for monthly plan if no weekly
      if (!coveringWeeklyMonthly) {
        coveringWeeklyMonthly = plans.find((plan) => {
          if (plan.period !== "monthly") return false;
          const planDate = new Date(plan.date);
          return (
            planDate.getMonth() === date.getMonth() &&
            planDate.getFullYear() === date.getFullYear()
          );
        });
      }
    }

    setSelectedPlan(dailyPlan || null);
    setCoveringPlan(coveringWeeklyMonthly || null);
    setShowPlanModal(true);
  };

  const handlePlanSave = (savedPlan) => {
    // Refetch all data to ensure we have the latest plans
    // This is important because creating a weekly/monthly plan may delete daily plans
    fetchMonthData();
  };

  const handleViewTrades = (date, dayTrades, e) => {
    e.stopPropagation(); // Prevent opening plan modal
    setSelectedDate(date);
    setSelectedDayTrades(dayTrades);
    setShowTradesModal(true);
  };

  if (loading) {
    return <Loading text="در حال بارگذاری تقویم..." />;
  }

  // Generate calendar days (always include the last day, including the 31st)
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekdayStats = Array.from({ length: 7 }, () => ({
    profit: 0,
    wins: 0,
    losses: 0,
    count: 0,
  }));
  for (const trade of monthTrades || []) {
    const tradeDate = new Date(trade.closeTime);
    if (
      tradeDate.getMonth() !== currentMonth.getMonth() ||
      tradeDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      continue;
    }
    const dow = tradeDate.getDay();
    weekdayStats[dow].count += 1;
    weekdayStats[dow].profit += trade.profit || 0;
    if (trade.profit > 0) weekdayStats[dow].wins += 1;
    else if (trade.profit < 0) weekdayStats[dow].losses += 1;
  }

  // Calculate month summary
  const monthProfit = (monthTrades || []).reduce(
    (sum, trade) => sum + trade.profit,
    0,
  );
  const monthWins = (monthTrades || []).filter((t) => t.profit > 0).length;
  const monthWinRate =
    (monthTrades || []).length > 0
      ? ((monthWins / (monthTrades || []).length) * 100).toFixed(1)
      : 0;
  const hasMonthTrades = (monthTrades || []).length > 0;
  const isMonthProfit = hasMonthTrades && monthProfit > 0;
  const isMonthLoss = hasMonthTrades && monthProfit < 0;
  const isMonthBreakEven = hasMonthTrades && monthProfit === 0;

  // Calculate compliance stats for month
  let monthCompliantTrades = 0;
  let monthUndisciplinedTrades = 0;
  let monthNoPlanTrades = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dayTrades = (monthTrades || []).filter((trade) => {
      const tradeDate = new Date(trade.closeTime);
      return (
        tradeDate.getDate() === day &&
        tradeDate.getMonth() === currentMonth.getMonth() &&
        tradeDate.getFullYear() === currentMonth.getFullYear()
      );
    });

    if (dayTrades.length === 0) continue;

    // Find plan for this day
    const dayPlan = getPlanForDate(plans, date);

    // Check compliance
    const compliance = checkPlanCompliance(dayTrades, dayPlan);
    monthCompliantTrades += compliance.compliant.length;
    monthUndisciplinedTrades += compliance.undisciplined.length;
    monthNoPlanTrades += compliance.noPlan.length;
  }

  return (
    <div dir="ltr">
      {/* Horizontal scroll on mobile — wider day cells for full desktop-like data */}
      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="min-w-[740px] sm:min-w-[820px] md:min-w-0">
          {/* Week days header + Weekly Summary column */}
          <div className="grid grid-cols-8 gap-1.5 md:gap-2 mb-2">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`text-center font-bold py-1.5 md:py-2 text-[11px] md:text-sm ${
                  day === "Sat" || day === "Sun"
                    ? "text-red-500"
                    : "text-gray-600"
                }`}
              >
                <span>{day}</span>
                {(day === "Sat" || day === "Sun") && (
                  <span className="block text-[10px] md:text-xs" title="Market Closed">
                    🔒
                  </span>
                )}
              </div>
            ))}
            <div className="text-center font-bold text-primary-600 py-1.5 md:py-2 text-[11px] md:text-sm">
              <span className="hidden md:inline">Week Total</span>
              <span className="md:hidden">Week</span>
            </div>
          </div>

          {/* Calendar weeks with weekly summary */}
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="grid grid-cols-8 gap-1.5 md:gap-2 mb-1.5 md:mb-2"
            >
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="min-h-[118px] md:min-h-[128px]"
                    ></div>
                  );
                }

                const date = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day,
                );
                const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                const dayTrades = (monthTrades || []).filter((trade) => {
                  const tradeDate = new Date(trade.closeTime);
                  return (
                    tradeDate.getDate() === day &&
                    tradeDate.getMonth() === currentMonth.getMonth() &&
                    tradeDate.getFullYear() === currentMonth.getFullYear()
                  );
                });

                const dayProfit = dayTrades.reduce(
                  (sum, trade) => sum + trade.profit,
                  0,
                );
                const dayWins = dayTrades.filter((t) => t.profit > 0).length;
                const dayLosses = dayTrades.filter((t) => t.profit < 0).length;
                const dayWinRate =
                  dayTrades.length > 0
                    ? ((dayWins / dayTrades.length) * 100).toFixed(0)
                    : 0;
                const hasTrades = dayTrades.length > 0;
                const isProfit = hasTrades && dayProfit > 0;
                const isLoss = hasTrades && dayProfit < 0;
                const isBreakEven = hasTrades && dayProfit === 0;

                // Find plan for this day (check daily, weekly, monthly)
                let dayPlan = null;

                // Check for daily plan
                dayPlan = plans.find((plan) => {
                  const planDate = new Date(plan.date);
                  return (
                    planDate.getDate() === day &&
                    planDate.getMonth() === currentMonth.getMonth() &&
                    planDate.getFullYear() === currentMonth.getFullYear() &&
                    plan.period === "daily"
                  );
                });

                // Check for weekly plan if no daily
                if (!dayPlan) {
                  dayPlan = plans.find((plan) => {
                    if (plan.period !== "weekly") return false;

                    const planDate = new Date(plan.date);
                    const weekStart = new Date(planDate);
                    const dayOfWeek = weekStart.getDay();
                    weekStart.setDate(weekStart.getDate() - dayOfWeek);
                    weekStart.setHours(0, 0, 0, 0);

                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);

                    return date >= weekStart && date <= weekEnd;
                  });
                }

                // Check for monthly plan if no daily or weekly
                if (!dayPlan) {
                  dayPlan = plans.find((plan) => {
                    if (plan.period !== "monthly") return false;
                    const planDate = new Date(plan.date);
                    return (
                      planDate.getMonth() === currentMonth.getMonth() &&
                      planDate.getFullYear() === currentMonth.getFullYear()
                    );
                  });
                }

                // Check plan compliance for each trade
                const complianceResult = checkPlanCompliance(
                  dayTrades,
                  dayPlan,
                );
                const undisciplinedCount =
                  complianceResult.undisciplined.length;

                // Day is disciplined if has plan and all trades comply
                // Day is undisciplined if has plan but some trades violate, OR has trades but no plan
                const hasPlan = !!dayPlan;
                const isDisciplined =
                  hasTrades && hasPlan && undisciplinedCount === 0;
                const isUndisciplined =
                  (hasTrades && hasPlan && undisciplinedCount > 0) ||
                  (hasTrades && !hasPlan && !isWeekend);

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => handleDayClick(date, dayTrades)}
                    className={`
                  border rounded-xl p-1.5 md:p-2.5 min-h-[118px] md:min-h-[128px] transition-all relative flex flex-col overflow-hidden group
                  ${isWeekend ? "cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"}
                  ${isWeekend ? "bg-slate-200/70 border-slate-300 opacity-80" : ""}
                  ${!isWeekend && isProfit ? "bg-emerald-100 border-emerald-300 hover:bg-emerald-200/80" : ""}
                  ${!isWeekend && isLoss ? "bg-rose-100 border-rose-300 hover:bg-rose-200/80" : ""}
                  ${!isWeekend && isBreakEven ? "bg-amber-100 border-amber-300 hover:bg-amber-200/80" : ""}
                  ${!isWeekend && !hasTrades ? "bg-slate-50 border-slate-200 hover:bg-slate-100/80" : ""}
                  ${isUndisciplined ? "ring-1 md:ring-2 ring-orange-400" : ""}
                  ${isDisciplined ? "ring-1 md:ring-2 ring-primary-400" : ""}
                `}
                  >
                    {isWeekend && (
                      <div
                        className="absolute top-1 left-1 text-slate-500 text-[10px] md:text-sm"
                        title="Market Closed"
                      >
                        🔒
                      </div>
                    )}

                    {/* Day number + mobile view icon */}
                    <div className="flex items-start justify-between gap-0.5">
                      <div
                        className={`font-bold text-left text-xs md:text-sm ${isWeekend ? "text-slate-400" : "text-slate-700"}`}
                      >
                        {day}
                      </div>
                      {dayTrades.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) =>
                            handleViewTrades(date, dayTrades, e)
                          }
                          title="مشاهده معاملات"
                          aria-label="مشاهده معاملات"
                          className="md:hidden flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-600 text-white active:bg-primary-700"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Same data on mobile + desktop */}
                    {dayTrades.length > 0 && (
                      <div className="flex text-left flex-col flex-1 mt-1 min-w-0">
                        <div
                          className={`text-[13px] md:text-base font-bold tabular-nums leading-tight ${isProfit ? "text-emerald-700" : isLoss ? "text-rose-700" : "text-amber-700"}`}
                        >
                          {dayProfit >= 0 ? "+" : "-"}$
                          {Math.abs(dayProfit).toFixed(2)}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[10px] md:text-[11px] text-slate-600">
                          <div>
                            {dayTrades.length} trades ·{" "}
                            <span className="text-emerald-700 font-semibold">
                              W{dayWins}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-rose-700 font-semibold">
                              L{dayLosses}
                            </span>
                          </div>
                          <div>WR: {dayWinRate}%</div>
                        </div>
                        <div className="mt-auto pt-1.5">
                          {isDisciplined && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-100 text-primary-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium">
                              ✓ منظم
                            </span>
                          )}
                          {isUndisciplined && hasPlan && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium">
                              ⚠ {undisciplinedCount} نامنظم
                            </span>
                          )}
                          {isUndisciplined && !hasPlan && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium">
                              بدون پلن
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) =>
                              handleViewTrades(date, dayTrades, e)
                            }
                            className="hidden md:block mt-1 w-full text-left text-[11px] font-medium text-primary-600 opacity-70 group-hover:opacity-100 hover:underline transition-opacity"
                          >
                            مشاهده →
                          </button>
                        </div>
                      </div>
                    )}
                    {isWeekend && dayTrades.length === 0 && (
                      <div className="text-[10px] md:text-xs text-slate-500 text-center mt-2">
                        Weekend
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Weekly summary */}
              {(() => {
                const weekTrades = (monthTrades || []).filter((trade) => {
                  const tradeDate = new Date(trade.closeTime);
                  const tradeDayOfWeek = tradeDate.getDay();
                  const firstDayOfWeek = week.find((d) => d !== null);
                  if (!firstDayOfWeek) return false;

                  const weekStart = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    firstDayOfWeek,
                  );
                  const weekStartDay = weekStart.getDay();
                  const daysToSubtract = weekStartDay === 0 ? 0 : weekStartDay;
                  weekStart.setDate(weekStart.getDate() - daysToSubtract);

                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekEnd.getDate() + 6);

                  return tradeDate >= weekStart && tradeDate <= weekEnd;
                });

                const weekProfit = weekTrades.reduce(
                  (sum, trade) => sum + trade.profit,
                  0,
                );
                const weekWins = weekTrades.filter((t) => t.profit > 0).length;
                const weekLosses = weekTrades.filter((t) => t.profit < 0).length;
                const weekWinRate =
                  weekTrades.length > 0
                    ? ((weekWins / weekTrades.length) * 100).toFixed(1)
                    : 0;
                const hasWeekTrades = weekTrades.length > 0;
                const isWeekProfit = hasWeekTrades && weekProfit > 0;
                const isWeekLoss = hasWeekTrades && weekProfit < 0;
                const isWeekBreakEven = hasWeekTrades && weekProfit === 0;

                // Calculate compliance stats for this week
                let weekCompliantTrades = 0;
                let weekUndisciplinedTrades = 0;
                let weekNoPlanTrades = 0;

                week.forEach((day) => {
                  if (day === null) return;
                  const date = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day,
                  );
                  const dayOfWeek = date.getDay();
                  if (dayOfWeek === 0 || dayOfWeek === 6) return; // Skip weekends

                  const dayTrades = (monthTrades || []).filter((trade) => {
                    const tradeDate = new Date(trade.closeTime);
                    return (
                      tradeDate.getDate() === day &&
                      tradeDate.getMonth() === currentMonth.getMonth() &&
                      tradeDate.getFullYear() === currentMonth.getFullYear()
                    );
                  });

                  if (dayTrades.length === 0) return;

                  // Find plan for this day
                  const dayPlan = getPlanForDate(plans, date);

                  // Check compliance
                  const compliance = checkPlanCompliance(dayTrades, dayPlan);
                  weekCompliantTrades += compliance.compliant.length;
                  weekUndisciplinedTrades += compliance.undisciplined.length;
                  weekNoPlanTrades += compliance.noPlan.length;
                });

                return (
                  <div
                    className={`
                border-2 rounded-xl p-1.5 md:p-3 min-h-[118px] md:min-h-[128px] font-semibold
                ${isWeekProfit ? "bg-emerald-100 border-emerald-400" : ""}
                ${isWeekLoss ? "bg-rose-100 border-rose-400" : ""}
                ${isWeekBreakEven ? "bg-amber-100 border-amber-400" : ""}
                ${!hasWeekTrades ? "bg-slate-50 border-slate-300" : ""}
              `}
                  >
                    <div className="text-[10px] md:text-xs space-y-1 text-left">
                      {hasWeekTrades ? (
                        <>
                          <div
                            className={`font-bold text-[13px] md:text-sm tabular-nums ${isWeekProfit ? "text-emerald-700" : isWeekLoss ? "text-rose-700" : "text-amber-700"}`}
                          >
                            {weekProfit >= 0 ? "+" : "-"}$
                            {Math.abs(weekProfit).toFixed(2)}
                          </div>
                          <div className="text-slate-600">
                            {weekTrades.length} trades ·{" "}
                            <span className="text-emerald-700">W{weekWins}</span>
                            /
                            <span className="text-rose-700">L{weekLosses}</span>
                          </div>
                          <div className="text-slate-600">
                            WR: {weekWinRate}%
                          </div>
                          {(weekCompliantTrades > 0 ||
                            weekUndisciplinedTrades > 0 ||
                            weekNoPlanTrades > 0) && (
                            <div className="text-[10px] md:text-xs pt-1 border-t border-gray-300 space-y-0.5">
                              {weekCompliantTrades > 0 && (
                                <div className="text-blue-700">
                                  ✓ {weekCompliantTrades}
                                </div>
                              )}
                              {weekUndisciplinedTrades > 0 && (
                                <div className="text-orange-700">
                                  ⚠ {weekUndisciplinedTrades}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-400 text-center text-xs">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}

          {/* Weekday totals (Mon–Fri) + Month Total */}
          <div className="grid grid-cols-8 gap-1.5 md:gap-2 mt-2 md:mt-4 pt-2 md:pt-4 border-t-2 border-slate-200">
            {weekdayStats.map((wd, di) => {
              const isWeekend = di === 0 || di === 6;
              const has = wd.count > 0;
              const wr =
                has && wd.count > 0
                  ? ((wd.wins / wd.count) * 100).toFixed(0)
                  : 0;
              const isProfit = has && wd.profit > 0;
              const isLoss = has && wd.profit < 0;
              return (
                <div
                  key={`wd-${di}`}
                  className={`
                    border-2 rounded-xl p-1.5 md:p-2 min-h-[118px] md:min-h-[128px]
                    ${isWeekend ? "bg-slate-200/70 border-slate-300 opacity-80" : ""}
                    ${!isWeekend && isProfit ? "bg-emerald-100 border-emerald-400" : ""}
                    ${!isWeekend && isLoss ? "bg-rose-100 border-rose-400" : ""}
                    ${!isWeekend && has && wd.profit === 0 ? "bg-amber-100 border-amber-400" : ""}
                    ${!isWeekend && !has ? "bg-slate-50 border-slate-300" : ""}
                  `}
                >
                  {isWeekend ? (
                    <div className="text-slate-400 text-center text-xs mt-6">
                      —
                    </div>
                  ) : (
                    <div className="text-[10px] md:text-xs space-y-1 text-left">
                      <div className="font-bold text-[9px] md:text-[10px] text-slate-500">
                        {weekdayNames[di]}
                      </div>
                      {has ? (
                        <>
                          <div
                            className={`font-bold text-[13px] md:text-sm tabular-nums ${
                              isProfit
                                ? "text-emerald-700"
                                : isLoss
                                  ? "text-rose-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {wd.profit >= 0 ? "+" : "-"}$
                            {Math.abs(wd.profit).toFixed(2)}
                          </div>
                          <div className="text-slate-600">
                            {wd.count} trades ·{" "}
                            <span className="text-emerald-700">W{wd.wins}</span>
                            /
                            <span className="text-rose-700">L{wd.losses}</span>
                          </div>
                          <div className="text-slate-600">WR: {wr}%</div>
                        </>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div
              className={`
          border-2 rounded-xl p-2 md:p-4 font-bold
          ${isMonthProfit ? "bg-emerald-100 border-emerald-500" : ""}
          ${isMonthLoss ? "bg-rose-100 border-rose-500" : ""}
          ${isMonthBreakEven ? "bg-amber-100 border-amber-500" : ""}
          ${!hasMonthTrades ? "bg-slate-50 border-slate-300" : ""}
        `}
            >
              <div className="text-xs md:text-sm space-y-1 text-left">
                <div className="text-[10px] md:text-xs font-bold text-primary-700">
                  Month Total
                </div>
                {hasMonthTrades ? (
                  <>
                    <div
                      className={`font-bold text-sm md:text-base tabular-nums ${
                        isMonthProfit
                          ? "text-emerald-700"
                          : isMonthLoss
                            ? "text-rose-700"
                            : "text-amber-700"
                      }`}
                    >
                      {monthProfit >= 0 ? "+" : "-"}$
                      {Math.abs(monthProfit).toFixed(2)}
                    </div>
                    <div className="text-slate-600">
                      {(monthTrades || []).length} trades
                    </div>
                    <div className="text-slate-600">WR: {monthWinRate}%</div>
                    {(monthCompliantTrades > 0 ||
                      monthUndisciplinedTrades > 0 ||
                      monthNoPlanTrades > 0) && (
                      <div className="text-xs pt-2 border-t border-gray-400 space-y-1">
                        {monthCompliantTrades > 0 && (
                          <div
                            className="text-blue-700 font-semibold"
                            title="Compliant Trades"
                          >
                            ✓ {monthCompliantTrades} معامله منظم
                          </div>
                        )}
                        {monthUndisciplinedTrades > 0 && (
                          <div
                            className="text-orange-700 font-semibold"
                            title="Undisciplined Trades"
                          >
                            ⚠ {monthUndisciplinedTrades} معامله نامنظم
                          </div>
                        )}
                        {monthNoPlanTrades > 0 && (
                          <div
                            className="text-gray-700 font-semibold"
                            title="No Plan Trades"
                          >
                            📋 {monthNoPlanTrades} بدون پلن
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-center">No trades</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Modal */}
      {selectedDate && (
        <PlanModal
          isOpen={showPlanModal}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedDate(null);
            setSelectedPlan(null);
            setCoveringPlan(null);
          }}
          date={selectedDate}
          userId={userId}
          existingPlan={selectedPlan}
          coveringPlan={coveringPlan}
          onSave={handlePlanSave}
        />
      )}

      {/* Day Trades Modal */}
      <DayTradesModal
        isOpen={showTradesModal}
        onClose={() => {
          setShowTradesModal(false);
          setSelectedDayTrades([]);
        }}
        date={selectedDate}
        trades={selectedDayTrades}
        userId={userId}
        onTradesUpdated={(tradeId, patch) => {
          setSelectedDayTrades((prev) =>
            (prev || []).map((t) =>
              t._id === tradeId ? { ...t, ...patch } : t,
            ),
          );
          onTradeUpdated?.(tradeId, patch);
        }}
      />
    </div>
  );
}

function QuickActionCard({ title, description, icon, href }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-gray-900"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}
