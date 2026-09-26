"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import WallCalendar from "@/components/WallCalendar";
import WallBacktestCalendar from "@/components/WallBacktestCalendar";
import ProposalForm from "@/components/ProposalForm";
import { UserName } from "@/components/VerifiedBadge";
import { MONTH_NAMES } from "@/utils/periods";
import { getSessionUser } from "@/utils/session";
import TradeSummaryCards from "@/components/TradeSummaryCards";

const ACTIVITY_LABELS = {
  book: "کتاب",
  video: "ویدیو",
  course: "دوره",
  article: "مقاله",
  practice: "تمرین",
  other: "سایر",
};

const ACHIEVEMENT_LABELS = {
  winrate_year: "وین‌ریت سالانه",
  winrate_month: "وین‌ریت ماهانه",
  winrate_week: "وین‌ریت هفتگی",
  profit_year: "سود سالانه",
  profit_month: "سود ماهانه",
  profit_week: "سود هفتگی",
};

function formatAchievementValue(category, value) {
  if (category?.startsWith("winrate")) return `${Number(value).toFixed(1)}%`;
  const n = Number(value);
  const sign = n >= 0 ? "" : "-";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export default function UserWallPage() {
  const params = useParams();
  const userId = params?.userId;

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateUser, setPrivateUser] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    setViewer(getSessionUser());
  }, []);

  const loadWall = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const monthKey = `${monthCursor.year}-${String(monthCursor.month).padStart(2, "0")}`;
      const session = getSessionUser();
      const params = new URLSearchParams({ month: monthKey });
      if (session?.id) params.set("viewerId", session.id);

      const res = await fetch(`/api/wall/${userId}?${params}`);
      const json = await res.json();

      if (res.status === 403 || json.private) {
        setIsPrivate(true);
        setPrivateUser(json.user || null);
        setData(null);
        return;
      }

      if (!res.ok) throw new Error(json.error || "خطا در دریافت دیوار");

      setIsPrivate(false);
      setData(json);
    } catch (err) {
      setError(err.message || "خطا در دریافت دیوار");
    } finally {
      setLoading(false);
    }
  }, [userId, monthCursor]);

  useEffect(() => {
    loadWall();
  }, [loadWall]);

  const shiftMonth = (delta) => {
    setMonthCursor((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  if (loading && !data && !isPrivate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="در حال بارگذاری دیوار کاربر..." />
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="page-shell text-white">
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <Link
            href="/leaderboards"
            className="text-primary-300 hover:text-primary-200 text-sm"
          >
            ← بازگشت به لیدربورد
          </Link>
          <div className="mt-10 bg-white/10 border border-white/15 rounded-2xl p-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">
              <UserName
                name={privateUser?.publicName}
                verified={privateUser?.verified}
                badgeClassName="w-5 h-5 text-blue-400"
              />
            </h1>
            <p className="text-gray-300">
              این دیوار کاربری خصوصی است و برای دیگران قابل مشاهده نیست.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/leaderboards"
            className="text-primary-600 hover:underline"
          >
            بازگشت به لیدربورد
          </Link>
        </div>
      </div>
    );
  }

  const user = data?.user;
  const privacy = data?.privacy || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="theme-surface text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <Link
              href="/leaderboards"
              className="text-primary-300 hover:text-primary-200 text-sm"
            >
              ← لیدربورد
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="logo-badge">
                <Image
                  src="/icons/tradingwall-icon-dark.png"
                  alt="Trading Wall"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <span className="trading-wall-logo text-sm">Trading Wall</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shrink-0">
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                <UserName
                  name={user?.publicName}
                  verified={user?.verified}
                  badgeClassName="w-5 h-5 text-blue-400"
                />
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {[user?.city, user?.province].filter(Boolean).join("، ") ||
                  "دیوار کاربر"}
              </p>
              {data?.adminView && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  مشاهده ادمین — حریم خصوصی نادیده گرفته شده
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {privacy.showTradeSummary && (
          <TradeSummaryCards
            summary={data.tradeSummary}
            monthLabel={data.tradeSummary?.monthLabel}
            yearLabel={data.tradeSummary?.yearLabel}
          />
        )}

        {(privacy.showCalendar || privacy.showBacktestCalendar) && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="px-3 py-1.5 rounded-lg border bg-white text-sm hover:bg-gray-50"
            >
              ماه قبل
            </button>
            <span className="text-sm font-medium min-w-[8rem] text-center bg-white px-3 py-1.5 rounded-lg border">
              {MONTH_NAMES[monthCursor.month - 1]} {monthCursor.year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="px-3 py-1.5 rounded-lg border bg-white text-sm hover:bg-gray-50"
            >
              ماه بعد
            </button>
          </div>
        )}

        {privacy.showCalendar && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📅 تقویم معاملاتی
            </h2>
            {loading ? (
              <Loading text="در حال بارگذاری تقویم..." />
            ) : (
              <WallCalendar
                year={data.calendar?.year || monthCursor.year}
                month={data.calendar?.month || monthCursor.month}
                trades={data.calendar?.trades || []}
                plans={data.calendar?.plans || []}
              />
            )}
          </section>
        )}

        {privacy.showBacktestCalendar && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🧪 تقویم بک‌تست
            </h2>
            {loading ? (
              <Loading text="در حال بارگذاری تقویم بک‌تست..." />
            ) : (
              <WallBacktestCalendar
                year={data.backtestCalendar?.year || monthCursor.year}
                month={data.backtestCalendar?.month || monthCursor.month}
                backtests={data.backtestCalendar?.backtests || []}
              />
            )}
          </section>
        )}

        {privacy.showChallenges && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6" dir="rtl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              چالش‌های بک‌تست
            </h2>
            {(data.challenges || []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                چالشی برای نمایش نیست
              </p>
            ) : (
              <div className="space-y-3">
                {data.challenges.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/challenges/${ch.inviteCode}`}
                    className="block rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 p-4 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{ch.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ch.type === 'trade' ? 'چالش معامله' : 'چالش بک‌تست'}
                          {' · '}
                          {ch.symbol}
                          {' · '}
                          {ch.role === 'creator' ? 'سازنده' : 'شرکت‌کننده'}
                          {' · '}
                          {ch.phase === 'ended'
                            ? 'پایان‌یافته'
                            : ch.phase === 'active'
                              ? 'فعال'
                              : ch.phase === 'upcoming'
                                ? 'به‌زودی'
                                : ch.phase}
                        </p>
                      </div>
                      {privacy.showChallengeResults && ch.result && (
                        <div className="text-xs text-left space-y-0.5 tabular-nums">
                          <div>
                            <span className="text-emerald-700">TP {ch.result.tp}</span>
                            {' · '}
                            <span className="text-rose-700">SL {ch.result.sl}</span>
                          </div>
                          <div className="text-gray-700 font-semibold">
                            {ch.result.unitNet >= 0 ? '+' : ''}
                            {ch.result.unitNet} R
                            {ch.result.hitRate != null
                              ? ` · ${ch.result.hitRate.toFixed(0)}%`
                              : ''}
                          </div>
                          <div className="text-gray-400">{ch.result.count} بک‌تست</div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {privacy.showAchievements && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🏆 دستاوردها
            </h2>
            {(data.achievements || []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                هنوز دستاوردی ثبت نشده است
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.achievements.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-amber-50/50 border-amber-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        رتبه {a.rank} —{" "}
                        {ACHIEVEMENT_LABELS[a.category] || a.category}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.period?.year}
                        {a.period?.month ? ` / ماه ${a.period.month}` : ""}
                        {a.period?.week ? ` / هفته ${a.period.week}` : ""}
                      </p>
                    </div>
                    <span className="font-bold text-amber-700">
                      {formatAchievementValue(a.category, a.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {privacy.showActivities && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📚 فعالیت‌های آموزشی
            </h2>
            {(data.activities || []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                فعالییتی ثبت نشده است
              </p>
            ) : (
              <div className="space-y-3">
                {data.activities.map((act) => (
                  <div
                    key={act._id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                          {ACTIVITY_LABELS[act.type] || act.type}
                        </span>
                        <h3 className="font-semibold text-gray-900 mt-2">
                          {act.title}
                        </h3>
                        {act.description && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {act.description}
                          </p>
                        )}
                        {act.link && (
                          <a
                            href={act.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                          >
                            مشاهده منبع
                          </a>
                        )}
                      </div>
                      {act.date && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(act.date).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {privacy.showSetups && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎯 ستاپ‌های شخصی
            </h2>
            {(data.setups || []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                ستاپ شخصی ثبت نشده است
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.setups.map((s) => (
                  <div key={s._id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    {s.description && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {privacy.allowJobOffers && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              💼 پیشنهاد کاری
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              اگر فرصت شغلی یا همکاری دارید، برای{" "}
              <UserName
                name={user?.publicName || "این کاربر"}
                verified={user?.verified}
                className="align-middle"
                badgeClassName="w-3.5 h-3.5 text-blue-500"
              />{" "}
              ارسال کنید. پیشنهاد در بخش پیام‌های ایشان نمایش داده می‌شود.
            </p>
            {viewer && String(viewer.id) === String(userId) ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                این دیوار متعلق به شماست — پیشنهاد کاری برای دیگران فعال است.
              </p>
            ) : (
              <ProposalForm
                requireLogin
                isLoggedIn={!!viewer}
                submitLabel="ارسال پیشنهاد کاری"
                onSubmit={async ({ title, body, image }) => {
                  const res = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: viewer.id,
                      type: "job_offer",
                      toUserId: userId,
                      title,
                      body,
                      image,
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok || !json.success) {
                    throw new Error(json.error || "خطا در ارسال پیشنهاد");
                  }
                }}
              />
            )}
          </section>
        )}

        {!privacy.showTradeSummary &&
          !privacy.showCalendar &&
          !privacy.showBacktestCalendar &&
          !privacy.showChallenges &&
          !privacy.showAchievements &&
          !privacy.showActivities &&
          !privacy.showSetups &&
          !privacy.allowJobOffers && (
            <p className="text-center text-gray-500 py-12">
              این کاربر هنوز بخشی برای نمایش عمومی انتخاب نکرده است.
            </p>
          )}
      </div>
    </div>
  );
}
