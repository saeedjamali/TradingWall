"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import LeaderboardBoard from "@/components/LeaderboardBoard";
import LeaderboardInsights from "@/components/LeaderboardInsights";
import {
  MONTH_NAMES,
  listWeeksInMonth,
  getHistoryYearOptions,
  getPreviousPeriodDate,
} from "@/utils/periods";

const PERIOD_META = {
  year: { titleSuffix: "سال", label: "سال جاری" },
  month: { titleSuffix: "ماه", label: "ماه جاری" },
  week: { titleSuffix: "هفته", label: "هفته جاری" },
};

const METRIC_META = {
  winrate: {
    groupTitle: "برترین وین‌ریت",
    title: (p) => `برترین وین‌ریت ${PERIOD_META[p].titleSuffix}`,
    description: (p) => `بالاترین درصد موفقیت در ${PERIOD_META[p].label}`,
  },
  profit: {
    groupTitle: "سودده‌ترین‌ها",
    title: (p) => `سودده‌ترین ${PERIOD_META[p].titleSuffix}`,
    description: (p) => `بیشترین سود دلاری در ${PERIOD_META[p].label}`,
  },
};

const PERIOD_ORDER = ["week", "month", "year"];

const selectClass =
  "bg-gray-800 border border-white/20 text-white rounded-lg px-3 py-2 text-sm min-w-[8.5rem]";

function defaultHistoryFilters() {
  const prevMonth = getPreviousPeriodDate("month");
  return {
    metric: "winrate",
    periodType: "month",
    year: String(prevMonth.getFullYear()),
    month: String(prevMonth.getMonth() + 1),
    weekOfMonth: "all",
  };
}

export default function LeaderboardsPage() {
  const [view, setView] = useState("current"); // current | history | insights
  const [boards, setBoards] = useState(null);
  const [minTrades, setMinTrades] = useState({ week: 5, month: 20, year: 220 });
  const [history, setHistory] = useState([]);
  const [histFilters, setHistFilters] = useState(defaultHistoryFilters);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => getHistoryYearOptions(new Date(), 10), []);
  const weekOptions = useMemo(() => {
    if (histFilters.periodType !== "week") return [];
    return listWeeksInMonth(histFilters.year, histFilters.month);
  }, [histFilters.periodType, histFilters.year, histFilters.month]);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboards?view=current");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت");
      setBoards(data.boards);
      if (data.minTrades) setMinTrades(data.minTrades);
    } catch (err) {
      setError(err.message || "خطا در دریافت لیدربورد");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        view: "history",
        metric: histFilters.metric,
        periodType: histFilters.periodType,
        year: histFilters.year,
        limit: "24",
      });

      if (
        histFilters.periodType === "month" ||
        histFilters.periodType === "week"
      ) {
        params.set("month", histFilters.month);
      }
      if (histFilters.periodType === "week") {
        params.set("weekOfMonth", histFilters.weekOfMonth);
      }

      const res = await fetch(`/api/leaderboards?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت");
      setHistory(data.snapshots || []);
    } catch (err) {
      setError(err.message || "خطا در دریافت تاریخچه");
    } finally {
      setHistLoading(false);
    }
  }, [histFilters]);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboards/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت گزارش");
      setInsights(data.report);
    } catch (err) {
      setError(err.message || "خطا در دریافت گزارش");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "current") loadCurrent();
  }, [view, loadCurrent]);

  useEffect(() => {
    if (view === "history") loadHistory();
  }, [view, loadHistory]);

  useEffect(() => {
    if (view === "insights") loadInsights();
  }, [view, loadInsights]);

  // Keep weekOfMonth valid when year/month change
  useEffect(() => {
    if (histFilters.periodType !== "week") return;
    if (histFilters.weekOfMonth === "all") return;
    const max = listWeeksInMonth(histFilters.year, histFilters.month).length;
    if (Number(histFilters.weekOfMonth) > max) {
      setHistFilters((prev) => ({ ...prev, weekOfMonth: "all" }));
    }
  }, [
    histFilters.periodType,
    histFilters.year,
    histFilters.month,
    histFilters.weekOfMonth,
  ]);

  const updateFilter = (key, value) => {
    setHistFilters((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "periodType") {
        if (value === "year") {
          next.month = "";
          next.weekOfMonth = "all";
        } else if (value === "month") {
          if (!next.month) next.month = "1";
          next.weekOfMonth = "all";
        } else if (value === "week") {
          if (!next.month) next.month = "1";
          next.weekOfMonth = "all";
        }
      }

      return next;
    });
  };

  const historyTitle = useMemo(() => {
    const y = histFilters.year;
    const m = Number(histFilters.month);
    if (histFilters.periodType === "year") return `سال ${y}`;
    if (histFilters.periodType === "month") {
      return `${MONTH_NAMES[m - 1] || ""} ${y}`;
    }
    if (histFilters.weekOfMonth === "all") {
      return `همه هفته‌های ${MONTH_NAMES[m - 1] || ""} ${y}`;
    }
    const w = weekOptions[Number(histFilters.weekOfMonth) - 1];
    return (
      w?.periodLabel ||
      `هفته ${histFilters.weekOfMonth} ${MONTH_NAMES[m - 1] || ""} ${y}`
    );
  }, [histFilters, weekOptions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-4"
          >
            ← بازگشت به صفحه اصلی
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link href="/">
              <div className="logo-badge">
                <Image
                  src="/icons/tradingwall-icon-dark.png"
                  alt="Trading Wall Logo"
                  width={64}
                  height={64}
                  className="w-14 h-14 md:w-16 md:h-16 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </div>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              جداول برترین‌ها
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            رتبه‌بندی بر اساس وین‌ریت و سود — به‌روزرسانی روزانه؛ نتایج دوره‌های
            گذشته قفل و ذخیره می‌شوند
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <TabButton
            active={view === "current"}
            onClick={() => setView("current")}
          >
            دوره جاری
          </TabButton>
          <TabButton
            active={view === "history"}
            onClick={() => setView("history")}
          >
            تاریخچه
          </TabButton>
          <TabButton
            active={view === "insights"}
            onClick={() => setView("insights")}
          >
            گزارش‌ها
          </TabButton>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 text-center">
            {error}
          </div>
        )}

        {view === "current" && (
          <div className="space-y-12 max-w-6xl mx-auto">
            {["winrate", "profit"].map((metric) => (
              <section key={metric}>
                <h2 className="text-2xl font-bold text-white mb-6 text-center md:text-right">
                  {METRIC_META[metric].groupTitle}
                </h2>
                <div className="grid md:grid-cols-3 gap-5">
                  {PERIOD_ORDER.map((periodType) => {
                    const board = boards?.[metric]?.[periodType];
                    return (
                      <LeaderboardBoard
                        key={`${metric}-${periodType}`}
                        title={METRIC_META[metric].title(periodType)}
                        description={METRIC_META[metric].description(
                          periodType,
                        )}
                        periodLabel={board?.periodLabel}
                        minTrades={minTrades[periodType]}
                        metric={metric}
                        entries={board?.entries || []}
                        loading={loading}
                      />
                    );
                  })}
                </div>
              </section>
            ))}

            <p className="text-center text-xs text-gray-500">
              حداقل معاملات: هفته {minTrades.week} · ماه {minTrades.month} · سال{" "}
              {minTrades.year} — کش روزانه تا بار سرور کم بماند
            </p>
          </div>
        )}

        {view === "history" && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 mb-8">
              <div className="flex flex-wrap justify-center gap-3 mb-3">
                <label className="flex flex-col gap-1 text-xs text-gray-400">
                  معیار
                  <select
                    value={histFilters.metric}
                    onChange={(e) => updateFilter("metric", e.target.value)}
                    className={selectClass}
                  >
                    <option value="winrate">وین‌ریت</option>
                    <option value="profit">سود</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-gray-400">
                  نوع دوره
                  <select
                    value={histFilters.periodType}
                    onChange={(e) => updateFilter("periodType", e.target.value)}
                    className={selectClass}
                  >
                    <option value="year">سالانه</option>
                    <option value="month">ماهانه</option>
                    <option value="week">هفتگی</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-gray-400">
                  سال
                  <select
                    value={histFilters.year}
                    onChange={(e) => updateFilter("year", e.target.value)}
                    className={selectClass}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                {(histFilters.periodType === "month" ||
                  histFilters.periodType === "week") && (
                  <label className="flex flex-col gap-1 text-xs text-gray-400">
                    ماه
                    <select
                      value={histFilters.month}
                      onChange={(e) => updateFilter("month", e.target.value)}
                      className={selectClass}
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={String(idx + 1)}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {histFilters.periodType === "week" && (
                  <label className="flex flex-col gap-1 text-xs text-gray-400">
                    هفته
                    <select
                      value={histFilters.weekOfMonth}
                      onChange={(e) =>
                        updateFilter("weekOfMonth", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="all">همه هفته‌ها</option>
                      {weekOptions.map((w) => (
                        <option key={w.periodKey} value={String(w.weekOfMonth)}>
                          هفته {w.weekOfMonth}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <p className="text-center text-sm text-primary-300">
                {historyTitle}
              </p>
            </div>

            {histLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-400 py-16">
                نتیجه‌ای برای <span className="text-white">{historyTitle}</span>{" "}
                ذخیره نشده است.
                <br />
                <span className="text-sm text-gray-500">
                  نتایج فقط بعد از پایان دوره (پایان هفته / ماه / سال) قفل
                  می‌شوند.
                </span>
              </p>
            ) : (
              <div
                className={`grid gap-5 ${history.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}`}
              >
                {history.map((snap) => (
                  <LeaderboardBoard
                    key={snap._id || snap.periodKey}
                    title={
                      snap.metric === "winrate"
                        ? `وین‌ریت ${PERIOD_META[snap.periodType]?.titleSuffix || ""}`
                        : `سود ${PERIOD_META[snap.periodType]?.titleSuffix || ""}`
                    }
                    periodLabel={snap.periodLabel}
                    minTrades={minTrades[snap.periodType]}
                    metric={snap.metric}
                    entries={snap.entries || []}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === "insights" && (
          <LeaderboardInsights report={insights} loading={insightsLoading} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? "bg-primary-600 border-primary-500 text-white"
          : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
