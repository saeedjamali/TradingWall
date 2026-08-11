"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import WallCalendar from "@/components/WallCalendar";
import ProposalForm from "@/components/ProposalForm";
import { MONTH_NAMES } from "@/utils/periods";
import { getSessionUser } from "@/utils/session";

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

function VerifiedBadge() {
  return (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-label="تایید شده"
    >
      <path
        fillRule="evenodd"
        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
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
      const res = await fetch(`/api/wall/${userId}?month=${monthKey}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
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
              {privateUser?.publicName || "کاربر"}
              {privateUser?.verified && (
                <span className="inline-flex align-middle mr-2">
                  <VerifiedBadge />
                </span>
              )}
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
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {user?.publicName || "کاربر"}
                </h1>
                {user?.verified && <VerifiedBadge />}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {[user?.city, user?.province].filter(Boolean).join("، ") ||
                  "دیوار کاربر"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {privacy.showCalendar && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                📅 تقویم معاملاتی
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  ماه قبل
                </button>
                <span className="text-sm font-medium min-w-[8rem] text-center">
                  {MONTH_NAMES[monthCursor.month - 1]} {monthCursor.year}
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  ماه بعد
                </button>
              </div>
            </div>
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
              {user?.publicName || "این کاربر"} ارسال کنید. پیشنهاد در بخش
              پیام‌های ایشان نمایش داده می‌شود.
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

        {!privacy.showCalendar &&
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
