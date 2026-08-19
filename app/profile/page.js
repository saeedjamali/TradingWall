"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import VerifiedBadge, { UserName } from "@/components/VerifiedBadge";
import { provinces, getCitiesByProvince } from "@/utils/iranLocations";
import { getSessionUser } from "@/utils/session";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    publicName: "",
    profileImage: "",
    province: "",
    city: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [privacySettings, setPrivacySettings] = useState({
    isPublic: false,
    showCalendar: false,
    showBacktestCalendar: false,
    showChallenges: false,
    showChallengeResults: false,
    showAchievements: true,
    showActivities: true,
    showSetups: true,
    allowJobOffers: false,
  });
  const [achievements, setAchievements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    type: "book",
    link: "",
  });
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgFilter, setMsgFilter] = useState("all"); // all | site_feedback | job_offer
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({}); // messageId -> text
  const [replySaving, setReplySaving] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const parsedUser = getSessionUser();
    if (!parsedUser) {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    fetchProfile(parsedUser.id);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    router.push("/");
  };

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        const province = data.user.province || "";
        const city = data.user.city || "";

        setFormData({
          publicName: data.user.publicName,
          profileImage: data.user.profileImage || "",
          province,
          city,
        });

        // اگر استان انتخاب شده، لیست شهرها را تنظیم کن
        if (province) {
          setAvailableCities(getCitiesByProvince(province));
        }

        setPrivacySettings({
          isPublic: false,
          showCalendar: false,
          showBacktestCalendar: false,
          showChallenges: false,
          showChallengeResults: false,
          showAchievements: true,
          showActivities: true,
          showSetups: true,
          allowJobOffers: false,
          ...(data.user.privacySettings || {}),
        });

        // Load achievements & activities for owner tabs
        const [achRes, actRes] = await Promise.all([
          fetch(`/api/achievements?userId=${userId}`),
          fetch(`/api/activities?userId=${userId}`),
        ]);
        const achData = await achRes.json();
        const actData = await actRes.json();
        if (achData.success) setAchievements(achData.achievements || []);
        if (actData.success) setActivities(actData.activities || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityForm.title.trim()) {
      alert("عنوان فعالیت الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...activityForm }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => [data.activity, ...prev]);
        setActivityForm({ title: "", description: "", type: "book", link: "" });
        setShowActivityForm(false);
      } else {
        alert(data.error || "خطا در افزودن");
      }
    } catch (err) {
      alert("خطا در افزودن فعالیت");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm("این فعالیت حذف شود؟")) return;
    try {
      const res = await fetch(
        `/api/activities?userId=${user.id}&activityId=${activityId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => prev.filter((a) => a._id !== activityId));
      }
    } catch (err) {
      alert("خطا در حذف");
    }
  };

  const fetchUnreadCount = async (userId) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}&countOnly=1`);
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const fetchMessages = async () => {
    if (!user?.id) return;
    setMsgLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.id, box: "all" });
      if (msgFilter !== "all") params.set("type", msgFilter);
      const res = await fetch(`/api/messages?${params}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
        // Mark all as read once user opens the inbox
        if ((data.unreadCount || 0) > 0) {
          const markRes = await fetch("/api/messages", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, action: "readAll" }),
          });
          const markData = await markRes.json();
          if (markData.success) {
            setUnreadCount(0);
            // keep isUnread highlights for this visit so user sees which were new
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages" && user?.id) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, msgFilter, user?.id]);

  useEffect(() => {
    if (user?.id) fetchUnreadCount(user.id);
  }, [user?.id]);

  const handleReplyMessage = async (messageId) => {
    const text = (replyDrafts[messageId] || "").trim();
    if (!text) {
      alert("متن پاسخ را وارد کنید");
      return;
    }
    setReplySaving(messageId);
    try {
      const res = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          messageId,
          action: "reply",
          replyBody: text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...data.item, isUnread: false } : m,
          ),
        );
        setReplyDrafts((prev) => ({ ...prev, [messageId]: "" }));
        fetchUnreadCount(user.id);
      } else {
        alert(data.error || "خطا");
      }
    } catch {
      alert("خطا در ارسال پاسخ");
    } finally {
      setReplySaving(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          id: data.user.id || user.id,
          phone: data.user.phone || user.phone,
          publicName: data.user.publicName || formData.publicName,
          role: data.user.role || user.role,
          verified: data.user.verified ?? user.verified,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("پروفایل با موفقیت به‌روز شد");
      } else {
        alert(data.error || "خطا در ذخیره پروفایل");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          privacySettings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("تنظیمات حریم خصوصی با موفقیت به‌روز شد");
      }
    } catch (error) {
      console.error("Error saving privacy:", error);
      alert("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("لطفا یک فایل تصویری انتخاب کنید");
      return;
    }

    const { validateImageFile } = await import("@/utils/uploadLimits");
    const check = validateImageFile(file);
    if (!check.ok) {
      alert(check.error);
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "profile");
      formData.append("userId", user.id);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({ ...prev, profileImage: data.url }));
        alert("تصویر با موفقیت آپلود شد");
      } else {
        alert(data.error || "خطا در آپلود تصویر");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("خطا در آپلود تصویر");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setFormData((prev) => ({
      ...prev,
      province: selectedProvince,
      city: "", // پاک کردن شهر وقتی استان تغییر می‌کند
    }));

    // به‌روزرسانی لیست شهرها براساس استان انتخابی
    if (selectedProvince) {
      setAvailableCities(getCitiesByProvince(selectedProvince));
    } else {
      setAvailableCities([]);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          password: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("رمز عبور با موفقیت تنظیم شد");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(data.error || "خطا در تنظیم رمز عبور");
      }
    } catch (error) {
      console.error("Error saving password:", error);
      alert("خطا در تنظیم رمز عبور");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="در حال بارگذاری پروفایل..." />;
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg
                  className="w-5 h-5 rotate-180"
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
                <span className="font-medium hidden md:inline">بازگشت</span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="logo-badge-light">
                  <Image
                    src="/icons/tradingwall-icon-dark.png"
                    alt="Trading Wall Logo"
                    width={56}
                    height={56}
                    className="w-11 h-11 md:w-12 md:h-12"
                  />
                </div>
                <h1 className="text-xl md:text-2xl font-bold">
                  پروفایل کاربری
                </h1>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              title="خروج"
              className="flex items-center gap-2 px-2 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl">
                      {formData.publicName.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg">
                  <UserName
                    name={formData.publicName}
                    verified={user?.verified}
                    badgeClassName="w-4 h-4 text-blue-500"
                  />
                </h3>
                <p className="text-sm text-gray-500">{user?.phone}</p>
                {formData.province && formData.city && (
                  <p className="text-xs text-gray-400 mt-1">
                    📍 {formData.province}، {formData.city}
                  </p>
                )}
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "info"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  👤 اطلاعات کاربری
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "privacy"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  🧱 تنظیمات دیوار کاربر
                </button>
                {user?.id && (
                  <Link
                    href={`/wall/${user.id}`}
                    className="w-full text-right px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 block text-primary-700"
                  >
                    👁️ مشاهده دیوار من
                  </Link>
                )}
                <button
                  onClick={() => setActiveTab("password")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "password"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  🔑 تغییر رمز عبور
                </button>
                <Link
                  href="/profile/setups"
                  className="w-full text-right px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 block"
                >
                  📊 ستاپ‌های معاملاتی
                </Link>
                <Link
                  href="/profile/checklists"
                  className="w-full text-right px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 block"
                >
                  ✅ چک‌لیست‌های معاملاتی
                </Link>
                <button
                  onClick={() => setActiveTab("achievements")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "achievements"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  🏆 دستاوردها
                </button>
                <button
                  onClick={() => setActiveTab("activities")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "activities"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  📚 فعالیت‌ها
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                    activeTab === "messages"
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>💬 پیام‌ها</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "info" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">👤 اطلاعات کاربری</h2>

                <div className="space-y-6">
                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      تصویر پروفایل
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {formData.profileImage ? (
                          <img
                            src={formData.profileImage}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl border-2 border-gray-200">
                            {formData.publicName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                          <div className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                            {uploadingImage ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5 mr-2"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                در حال آپلود...
                              </>
                            ) : (
                              <>📷 انتخاب تصویر</>
                            )}
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          حداکثر 3 مگابایت - JPG, PNG
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Public Name */}
                  <Input
                    label="نام عمومی"
                    value={formData.publicName}
                    onChange={(e) =>
                      setFormData({ ...formData, publicName: e.target.value })
                    }
                    placeholder="نام نمایشی شما"
                  />

                  {/* Province & City */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        استان
                      </label>
                      <select
                        value={formData.province}
                        onChange={handleProvinceChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
                      >
                        <option value="">انتخاب استان</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شهر
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        disabled={!formData.province}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.province
                            ? "انتخاب شهر"
                            : "ابتدا استان را انتخاب کنید"}
                        </option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="شماره موبایل"
                    value={user?.phone}
                    disabled
                    helperText="شماره موبایل قابل تغییر نیست"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وضعیت تایید
                    </label>
                    <div className="flex items-center gap-2">
                      {user?.verified ? (
                        <>
                          <VerifiedBadge className="w-5 h-5 text-blue-500" />
                          <span className="text-green-600">حساب تایید شده</span>
                        </>
                      ) : (
                        <span className="text-gray-500">در انتظار تایید</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">
                  🧱 تنظیمات دیوار کاربر
                </h2>
                <p className="text-gray-600 mb-6">
                  دیوار شما صفحه‌ای عمومی است که دیگران از لیدربورد می‌توانند
                  ببینند. اول مشخص کنید خصوصی باشد یا عمومی؛ اگر عمومی بود،
                  بخش‌های قابل‌نمایش را تیک بزنید.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-primary-200 bg-primary-50/40 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        وضعیت دیوار
                      </h3>
                      <p className="text-sm text-gray-600">
                        {privacySettings.isPublic
                          ? "عمومی — دیگران می‌توانند دیوار شما را ببینند"
                          : "خصوصی — دیگران دسترسی ندارند"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium ${privacySettings.isPublic ? "text-emerald-600" : "text-gray-500"}`}
                      >
                        {privacySettings.isPublic ? "عمومی" : "خصوصی"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.isPublic}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              isPublic: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  <div
                    className={`space-y-4 ${privacySettings.isPublic ? "" : "opacity-50 pointer-events-none"}`}
                  >
                    <p className="text-sm font-medium text-gray-700 pt-2">
                      بخش‌های قابل‌نمایش روی دیوار
                      {!privacySettings.isPublic && (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          (ابتدا دیوار را عمومی کنید)
                        </span>
                      )}
                    </p>

                    <PrivacyToggle
                      title="تقویم معاملاتی"
                      description="نمایش فقط‌خواندنی تقویم و معاملات"
                      checked={privacySettings.showCalendar}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showCalendar: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="تقویم بک‌تست"
                      description="نمایش فقط‌خواندنی تقویم بک‌تست‌های شما روی دیوار"
                      checked={privacySettings.showBacktestCalendar}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showBacktestCalendar: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="چالش‌های بک‌تست و معامله"
                      description="نمایش چالش‌هایی که ساخته‌اید یا در آن‌ها شرکت کرده‌اید روی دیوار"
                      checked={privacySettings.showChallenges}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showChallenges: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="نتایج چالش‌ها"
                      description="نمایش خلاصه عملکرد شما در چالش بک‌تست / چالش معامله روی دیوار"
                      checked={privacySettings.showChallengeResults}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showChallengeResults: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="دستاوردها"
                      description="نمایش رتبه‌ها در لیدربورد"
                      checked={privacySettings.showAchievements}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showAchievements: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="فعالیت‌ها"
                      description="نمایش کتاب‌ها، دوره‌ها و فعالیت‌های آموزشی"
                      checked={privacySettings.showActivities}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showActivities: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="ستاپ‌ها"
                      description="نمایش ستاپ‌های شخصی و استراتژی‌ها"
                      checked={privacySettings.showSetups}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showSetups: checked,
                        })
                      }
                    />
                    <PrivacyToggle
                      title="پیشنهاد کاری"
                      description="سایر کاربران بتوانند روی دیوار شما پیشنهاد کاری بفرستند"
                      checked={privacySettings.allowJobOffers}
                      onChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          allowJobOffers: checked,
                        })
                      }
                    />
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleSavePrivacy}
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? "در حال ذخیره..." : "ذخیره تنظیمات دیوار"}
                    </Button>
                    {user?.id && (
                      <Link
                        href={`/wall/${user.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        پیش‌نمایش دیوار
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🔑 تغییر رمز عبور
                  </h2>
                  <p className="text-gray-600 mt-2">
                    با تنظیم رمز عبور، می‌توانید علاوه بر OTP با رمز عبور نیز
                    وارد شوید
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رمز عبور جدید
                    </label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="حداقل 6 کاراکتر"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تکرار رمز عبور
                    </label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="تکرار رمز عبور جدید"
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSavePassword}
                      disabled={
                        saving ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                      fullWidth
                    >
                      {saving ? "در حال ذخیره..." : "تنظیم رمز عبور"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">🏆 دستاوردها</h2>
                {achievements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>هنوز دستاوردی کسب نکرده‌اید</p>
                    <p className="text-sm mt-2">
                      با کسب رتبه در لیدربوردها در پایان هر دوره، دستاوردها
                      اینجا ثبت می‌شوند
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {achievements.map((a) => (
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
                          {String(a.category || "").startsWith("winrate")
                            ? `${Number(a.value).toFixed(1)}%`
                            : `$${Number(a.value).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activities" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">📚 فعالیت‌های آموزشی</h2>
                  <Button
                    size="sm"
                    onClick={() => setShowActivityForm((v) => !v)}
                  >
                    {showActivityForm ? "بستن" : "افزودن فعالیت"}
                  </Button>
                </div>

                {showActivityForm && (
                  <div className="border rounded-lg p-4 mb-6 space-y-3 bg-gray-50">
                    <Input
                      placeholder="عنوان"
                      value={activityForm.title}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          title: e.target.value,
                        })
                      }
                    />
                    <textarea
                      placeholder="توضیحات"
                      value={activityForm.description}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    />
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={activityForm.type}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            type: e.target.value,
                          })
                        }
                        className="border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="book">کتاب</option>
                        <option value="video">ویدیو</option>
                        <option value="course">دوره</option>
                        <option value="article">مقاله</option>
                        <option value="practice">تمرین</option>
                        <option value="other">سایر</option>
                      </select>
                      <Input
                        placeholder="لینک (اختیاری)"
                        value={activityForm.link}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            link: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button onClick={handleAddActivity} disabled={saving}>
                      {saving ? "در حال ذخیره..." : "ثبت فعالیت"}
                    </Button>
                  </div>
                )}

                {activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>هنوز فعالیتی ثبت نکرده‌اید</p>
                    <p className="text-sm mt-2">
                      کتاب‌ها، دوره‌ها و منابع آموزشی خود را اینجا ثبت کنید
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div
                        key={act._id}
                        className="border rounded-lg p-4 flex justify-between gap-3"
                      >
                        <div>
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                            {ACTIVITY_LABELS[act.type] || act.type}
                          </span>
                          <h3 className="font-semibold mt-2">{act.title}</h3>
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
                              className="text-sm text-primary-600 hover:underline mt-1 inline-block"
                            >
                              مشاهده منبع
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act._id)}
                          className="text-red-500 text-sm hover:underline shrink-0"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    💬 پیام‌ها
                    {unreadCount > 0 && (
                      <span className="text-sm font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {unreadCount} خوانده‌نشده
                      </span>
                    )}
                  </h2>
                  <select
                    value={msgFilter}
                    onChange={(e) => setMsgFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">همه</option>
                    <option value="site_feedback">نظرات سایت من</option>
                    <option value="job_offer">پیشنهادات کاری</option>
                  </select>
                </div>

                {msgLoading ? (
                  <Loading text="در حال بارگذاری پیام‌ها..." />
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>پیامی وجود ندارد</p>
                    <p className="text-sm mt-2">
                      نظرات صفحه اصلی و پیشنهادات کاری دیوار اینجا نمایش داده
                      می‌شوند
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => {
                      const senderId = String(
                        m.fromUserId?._id || m.fromUserId,
                      );
                      const recipientId = String(
                        m.toUserId?._id || m.toUserId || "",
                      );
                      const isIncomingJob =
                        m.type === "job_offer" &&
                        recipientId === String(user.id);
                      const isSent = senderId === String(user.id);
                      const canChat =
                        m.status !== "closed" &&
                        (isSent || isIncomingJob || m.type === "site_feedback");
                      const thread = Array.isArray(m.thread) ? m.thread : [];

                      return (
                        <div
                          key={m._id}
                          className={`border rounded-xl p-4 ${
                            m.isUnread
                              ? "bg-amber-50/80 border-amber-200"
                              : "bg-gray-50/80"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {m.isUnread && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                جدید
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                m.type === "site_feedback"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-violet-50 text-violet-700"
                              }`}
                            >
                              {m.type === "site_feedback"
                                ? "نظر سایت"
                                : "پیشنهاد کاری"}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                thread.length > 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {thread.length > 0
                                ? `${thread.length} پیام در گفتگو`
                                : "در انتظار پاسخ"}
                            </span>
                            {isIncomingJob && (
                              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                                از{" "}
                                <UserName
                                  name={m.fromUserId?.publicName}
                                  verified={m.fromUserId?.verified}
                                  badgeClassName="w-3 h-3 text-blue-500"
                                />
                              </span>
                            )}
                            {isSent && m.type === "job_offer" && (
                              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                                به{" "}
                                <UserName
                                  name={m.toUserId?.publicName}
                                  verified={m.toUserId?.verified}
                                  badgeClassName="w-3 h-3 text-blue-500"
                                />
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-gray-900">{m.title}</h3>

                          {/* Opening message */}
                          <div
                            className={`mt-3 rounded-lg p-3 ${
                              isSent
                                ? "bg-primary-50 border border-primary-100"
                                : "bg-white border"
                            }`}
                          >
                            <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1 flex-wrap">
                              <UserName
                                name={m.fromUserId?.publicName}
                                verified={m.fromUserId?.verified}
                                badgeClassName="w-3 h-3 text-blue-500"
                              />
                              <span>· پیام اولیه</span>
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {m.body}
                            </p>
                            {m.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.image}
                                alt=""
                                className="mt-2 max-h-40 rounded-lg border object-contain"
                              />
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(m.createdAt).toLocaleString("fa-IR")}
                            </p>
                          </div>

                          {/* Thread Q&A */}
                          {thread.length > 0 && (
                            <div className="mt-3 space-y-2 border-t border-dashed pt-3">
                              {thread.map((item, idx) => {
                                const fromId = String(
                                  item.fromUserId?._id || item.fromUserId,
                                );
                                const mine = fromId === String(user.id);
                                return (
                                  <div
                                    key={item._id || idx}
                                    className={`rounded-lg p-3 ${
                                      mine
                                        ? "bg-primary-50 border border-primary-100 mr-4"
                                        : "bg-white border ml-4"
                                    }`}
                                  >
                                    <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1 flex-wrap">
                                      <UserName
                                        name={
                                          item.fromUserId?.publicName ||
                                          (mine ? "شما" : "طرف مقابل")
                                        }
                                        verified={item.fromUserId?.verified}
                                        badgeClassName="w-3 h-3 text-blue-500"
                                      />
                                      {item.fromUserId?.role === "admin"
                                        ? " (مدیر)"
                                        : ""}
                                    </p>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {item.body}
                                    </p>
                                    {item.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.image}
                                        alt=""
                                        className="mt-2 max-h-32 rounded border object-contain"
                                      />
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      {item.createdAt
                                        ? new Date(
                                            item.createdAt,
                                          ).toLocaleString("fa-IR")
                                        : ""}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {canChat && (
                            <div className="mt-4 space-y-2">
                              <textarea
                                value={replyDrafts[m._id] || ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [m._id]: e.target.value,
                                  }))
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]"
                                placeholder="پیام بعدی را بنویسید..."
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReplyMessage(m._id)}
                                disabled={replySaving === m._id}
                              >
                                {replySaving === m._id
                                  ? "در حال ارسال..."
                                  : "ارسال پیام"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ACHIEVEMENT_LABELS = {
  winrate_year: "وین‌ریت سالانه",
  winrate_month: "وین‌ریت ماهانه",
  winrate_week: "وین‌ریت هفتگی",
  profit_year: "سود سالانه",
  profit_month: "سود ماهانه",
  profit_week: "سود هفتگی",
};

const ACTIVITY_LABELS = {
  book: "کتاب",
  video: "ویدیو",
  course: "دوره",
  article: "مقاله",
  practice: "تمرین",
  other: "سایر",
};

function PrivacyToggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
}
