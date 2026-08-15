"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import PlanModal from "@/components/PlanModal";
import MonthlyChart from "@/components/MonthlyChart";
import BuySellChart from "@/components/BuySellChart";
import WinRateTrendChart from "@/components/WinRateTrendChart";
import DisciplineResultChart from "@/components/DisciplineResultChart";
import SetupPerformanceChart from "@/components/SetupPerformanceChart";
import DayTradesModal from "@/components/DayTradesModal";
import MonthPlansListModal from "@/components/MonthPlansListModal";
import PreTradeChecklist from "@/components/PreTradeChecklist";
import FileUploadCard from "@/components/FileUploadCard";
import { UserName } from "@/components/VerifiedBadge";
import { checkPlanCompliance, getPlanForDate } from "@/utils/planCompliance";
import { getSessionUser } from "@/utils/session";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthTrades, setMonthTrades] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showMonthPlans, setShowMonthPlans] = useState(false);

  useEffect(() => {
    const parsedUser = getSessionUser();
    if (!parsedUser) {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    fetchStats(parsedUser.id);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    router.push("/");
  };

  useEffect(() => {
    if (user) {
      fetchMonthTrades(user.id);
    }
  }, [currentMonth, user]);

  const fetchStats = async (userId) => {
    try {
      const response = await fetch(`/api/trades/stats?userId=${userId}`);
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
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );

      const response = await fetch(
        `/api/trades?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`,
      );
      const data = await response.json();

      if (data.success) {
        setMonthTrades(data.trades || []);
      }
    } catch (error) {
      console.error("Error fetching month trades:", error);
    }
  };

  const handleExportCalendar = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      // Get calendar and chart elements
      const calendarElement = document.querySelector(
        ".calendar-export-section",
      );

      if (calendarElement) {
        const canvas = await html2canvas(calendarElement, {
          backgroundColor: "#f9fafb",
          scale: 2,
          logging: false,
          useCORS: true,
        });

        // Download as image
        const link = document.createElement("a");
        const monthName = monthNames[currentMonth.getMonth()];
        const year = currentMonth.getFullYear();
        link.download = `trading-calendar-${monthName}-${year}.png`;
        link.href = canvas.toDataURL();
        link.click();
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

            <nav className="flex gap-1 md:gap-4 items-center">
              {/* Desktop labels */}
              <Link
                href="/dashboard"
                className="hidden md:inline text-primary-300 font-semibold px-2"
              >
                دیوار معاملاتی
              </Link>
              <Link
                href="/dashboard/backtest"
                className="hidden md:inline text-white/70 hover:text-white px-2 transition-colors"
              >
                بک‌تست
              </Link>
              <Link
                href="/dashboard/trades"
                className="hidden md:inline text-white/70 hover:text-white px-2 transition-colors"
              >
                لیست معاملات
              </Link>
              <Link
                href="/profile"
                className="hidden md:inline text-white/70 hover:text-white px-2 transition-colors"
              >
                پروفایل
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden md:inline text-white/70 hover:text-white font-semibold px-2 transition-colors"
                >
                  پنل ادمین
                </Link>
              )}

              {/* Mobile icons */}
              <Link
                href="/dashboard"
                title="دیوار معاملاتی"
                className="md:hidden p-2 rounded-lg text-primary-300 bg-white/10 hover:bg-white/15 transition-colors"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </Link>
              <Link
                href="/dashboard/backtest"
                title="بک‌تست"
                className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Link>
              <Link
                href="/dashboard/trades"
                title="لیست معاملات"
                className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </Link>
              <Link
                href="/profile"
                title="پروفایل"
                className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  title="پنل ادمین"
                  className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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
                </Link>
              )}

              {/* Logout — quieter so red stays for P&L meaning */}
              <button
                onClick={handleLogout}
                title="خروج"
                className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
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
                <span className="hidden md:inline">خروج</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        <div className="calendar-export-section">
          {/* Calendar Header */}
          {/* Pre-Trade Checklist */}
          {user && <PreTradeChecklist userId={user.id} />}

          <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primary-50/40 shadow-md p-3 md:p-6 mb-8">
            {/* Title - Centered */}
            <div className="text-center mb-4 md:mb-6 relative px-12 sm:px-28">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                <span className="text-2xl md:text-4xl">📊</span>
                <h2 className="text-xl md:text-3xl font-bold text-gray-800">
                  Trading Calendar
                </h2>
              </div>
              <p className="text-xs md:text-sm text-gray-500">تقویم معاملاتی</p>

              {/* Export Button */}
              <button
                onClick={handleExportCalendar}
                disabled={isExporting}
                className="absolute left-0 top-0 p-2 md:px-4 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="دانلود تصویر تقویم و نمودار"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isExporting ? "در حال آماده‌سازی..." : "Export Image"}
                </span>
              </button>

              {/* Month plans list */}
              <button
                onClick={() => setShowMonthPlans(true)}
                className="absolute right-0 top-0 p-2 md:px-4 md:py-2 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2 text-sm"
                title="مشاهده پلن‌های این ماه"
              >
                <span>📋</span>
                <span className="hidden sm:inline">پلن‌های این ماه</span>
              </button>
            </div>

            {/* Month Navigation - Centered */}
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                    ),
                  )
                }
                className="p-2 md:p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                title="ماه بعد"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg min-w-[160px] md:min-w-[220px] text-center">
                <div className="text-lg md:text-2xl font-bold text-primary-800">
                  {monthNames[currentMonth.getMonth()]}{" "}
                  {currentMonth.getFullYear()}
                </div>
              </div>

              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                    ),
                  )
                }
                className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                title="ماه قبل"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Color Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs bg-white/70 border border-slate-200 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
                <span>Profit Day (روز سودده)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-100 border border-rose-300 rounded"></div>
                <span>Loss Day (روز ضررده)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
                <span>Break-even (بدون سود/ضرر)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                <span>No Trades (بدون معامله)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-200/70 border border-slate-300 rounded"></div>
                <span>Weekend (تعطیل)</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-400 rounded"></div>
                <span>✓ Disciplined (با پلن)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-400 rounded"></div>
                <span>⚠ Undisciplined (بدون پلن)</span>
              </div>
            </div>

            {/* راهنمای استفاده از تقویم */}
            <div
              dir="rtl"
              className="mb-4 rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-xs text-sky-900 leading-relaxed"
            >
              <p className="font-semibold mb-1">راهنمای تقویم</p>
              <ul className="space-y-1 list-disc list-inside text-sky-800/90">
                <li>
                  با کلیک روی هر روز، پنجرهٔ <strong>پلن معاملاتی</strong> باز
                  می‌شود.
                </li>
                <li>
                  با کلیک روی آیکون چشم / «مشاهده»، می‌توانید{" "}
                  <strong>معاملات آن روز</strong> را ببینید و برای هر معامله{" "}
                  <strong>ستاپ</strong> و <strong>تصویر</strong> ثبت کنید.
                </li>
              </ul>
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
              }}
            />
          </div>

          <MonthPlansListModal
            isOpen={showMonthPlans}
            onClose={() => setShowMonthPlans(false)}
            userId={user?.id}
            currentMonth={currentMonth}
          />

          {/* Monthly Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4 items-stretch">
            <div className="lg:col-span-3 h-full">
              <MonthlyChart trades={monthTrades} currentMonth={currentMonth} />
            </div>
            <div className="lg:col-span-2 h-full">
              <BuySellChart trades={monthTrades} currentMonth={currentMonth} />
            </div>
          </div>

          {/* Win Rate + Discipline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <WinRateTrendChart
              trades={monthTrades}
              currentMonth={currentMonth}
            />
            <DisciplineResultChart
              trades={monthTrades}
              currentMonth={currentMonth}
              userId={user?.id}
            />
          </div>

          {/* Setup performance report */}
          <div className="mb-8">
            <SetupPerformanceChart
              trades={monthTrades}
              currentMonth={currentMonth}
            />
          </div>
        </div>
        {/* End Export Section */}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Compact File Upload */}
          {user && (
            <FileUploadCard
              userId={user.id}
              compact={true}
              onUploadSuccess={() => fetchMonthTrades(user.id)}
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
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-md ${theme.card}`}
      title={tooltips[title]}
    >
      <div className={`absolute inset-y-0 right-0 w-1 ${theme.bar}`} />
      <div className="flex justify-between items-start gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-2xl ${theme.icon}`}
        >
          {icon}
        </div>
        <div className="text-right min-w-0">
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${valueClass}`}>
            {value}
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

  // Generate calendar days
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create array of days with empty cells for proper alignment
  const calendarDays = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate weekly summaries
  const weeks = [];
  let currentWeek = [];

  calendarDays.forEach((day, index) => {
    currentWeek.push(day);

    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add remaining days as last week (pad with nulls to make it 7 days)
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
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

          {/* Month Summary Row */}
          <div className="grid grid-cols-8 gap-1.5 md:gap-2 mt-2 md:mt-4 pt-2 md:pt-4 border-t-2 border-slate-200">
            <div className="col-span-7 text-right font-bold text-sm md:text-lg text-slate-700 flex items-center justify-end pr-2">
              Month Total:
            </div>
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
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}
