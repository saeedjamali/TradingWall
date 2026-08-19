"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import EmptyState, { NoTradesIcon } from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { formatDateTime } from "@/utils/dateHelpers";
import { getSessionUser } from "@/utils/session";
import SelectedSetupNote from "@/components/SelectedSetupNote";

export default function TradesListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    symbol: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setups, setSetups] = useState([]);
  const [editingTradeId, setEditingTradeId] = useState(null);
  const [selectedSetups, setSelectedSetups] = useState([]);
  const [showAddSetup, setShowAddSetup] = useState(false);
  const [newSetup, setNewSetup] = useState({ title: "", description: "" });

  useEffect(() => {
    const parsedUser = getSessionUser();
    if (!parsedUser) {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    fetchTrades(parsedUser.id);
    fetchSetups(parsedUser.id);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    router.push("/");
  };

  const fetchTrades = async (userId, page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== ""),
        ),
      });

      console.log("Fetching trades for user:", userId, "page:", page);
      const response = await fetch(`/api/trades?${queryParams}`);
      const data = await response.json();

      console.log("Trades response:", data);

      if (data.success) {
        setTrades(data.trades || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error("Failed to fetch trades:", data.error);
        setTrades([]);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSetups = async (userId) => {
    try {
      const response = await fetch(`/api/setups?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setSetups(data.setups || []);
      }
    } catch (error) {
      console.error("Error fetching setups:", error);
    }
  };

  const handleAddSetup = async () => {
    if (!newSetup.title.trim()) {
      alert("لطفا عنوان ستاپ را وارد کنید");
      return;
    }

    try {
      const response = await fetch("/api/setups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          title: newSetup.title,
          description: newSetup.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSetups(user.id);
        setNewSetup({ title: "", description: "" });
        setShowAddSetup(false);
        alert("ستاپ با موفقیت اضافه شد");
      } else {
        alert(data.error || "خطایی رخ داده است");
      }
    } catch (error) {
      console.error("Error adding setup:", error);
      alert("خطا در افزودن ستاپ");
    }
  };

  const startEditSetups = (trade) => {
    setSelectedTrade(trade);
    setSelectedSetups(trade.setupIds?.map((s) => s._id || s) || []);
    setShowSetupModal(true);
  };

  const toggleSetup = (setupId) => {
    setSelectedSetups((prev) =>
      prev.includes(setupId)
        ? prev.filter((id) => id !== setupId)
        : [...prev, setupId],
    );
  };

  const saveSetups = async () => {
    if (!selectedTrade) return;

    try {
      const response = await fetch(`/api/trades/${selectedTrade._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          setupIds: selectedSetups,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh trades to show updated setups
        await fetchTrades(user.id, pagination.page);
        setShowSetupModal(false);
        setSelectedTrade(null);
        setShowAddSetup(false);
        alert("ستاپ‌ها با موفقیت ذخیره شدند");
      } else {
        alert(data.error || "خطایی رخ داده است");
      }
    } catch (error) {
      console.error("Error saving setups:", error);
      alert("خطا در ذخیره ستاپ‌ها");
    }
  };

  const handleDelete = async () => {
    if (!selectedTrade) return;

    try {
      const response = await fetch(
        `/api/trades/${selectedTrade._id}?userId=${user.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (data.success) {
        setTrades(trades.filter((t) => t._id !== selectedTrade._id));
        setShowDeleteModal(false);
        setSelectedTrade(null);
        alert("معامله با موفقیت حذف شد");
      } else {
        alert(data.error || "خطا در حذف معامله");
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
      alert("خطا در حذف معامله");
    }
  };

  if (loading) {
    return <Loading text="در حال بارگذاری معاملات..." />;
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
                <h1 className="text-xl md:text-2xl font-bold">لیست معاملات</h1>
              </Link>
            </div>

            <div className="flex gap-2 items-center">
              {/* Desktop */}
              <Link href="/dashboard/trades/upload" className="hidden md:block">
                <Button variant="outline">بارگذاری فایل</Button>
              </Link>
              <Link href="/dashboard/trades/new" className="hidden md:block">
                <Button>افزودن معامله</Button>
              </Link>

              {/* Mobile icons */}
              <Link
                href="/dashboard/trades/upload"
                title="بارگذاری فایل"
                className="md:hidden p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </Link>
              <Link
                href="/dashboard/trades/new"
                title="افزودن معامله"
                className="md:hidden p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>

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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6" dir="ltr">
          <h3 className="text-lg font-bold mb-4 text-right" dir="rtl">
            فیلترها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="نماد (مثال: US30_i)"
              value={filters.symbol}
              onChange={(e) =>
                setFilters({ ...filters, symbol: e.target.value })
              }
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">همه انواع</option>
              <option value="buy">خرید</option>
              <option value="sell">فروش</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchTrades(user.id, 1);
              }}
            >
              اعمال فیلتر
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({
                  symbol: "",
                  type: "",
                  startDate: "",
                  endDate: "",
                });
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchTrades(user.id, 1);
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </div>

        {/* Add Setup Button */}
        {trades.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6" dir="rtl">
            <button
              type="button"
              onClick={() => setShowAddSetup(!showAddSetup)}
              className="w-full px-4 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              {showAddSetup ? "❌ لغو" : "➕ افزودن ستاپ جدید"}
            </button>

            {/* Add Setup Form */}
            {showAddSetup && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <input
                  type="text"
                  value={newSetup.title}
                  onChange={(e) =>
                    setNewSetup({ ...newSetup, title: e.target.value })
                  }
                  placeholder="عنوان ستاپ (مثال: Breakout Strategy)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <textarea
                  value={newSetup.description}
                  onChange={(e) =>
                    setNewSetup({ ...newSetup, description: e.target.value })
                  }
                  placeholder="توضیحات ستاپ (اختیاری)"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
                <button
                  type="button"
                  onClick={handleAddSetup}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  ✅ ذخیره ستاپ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trades Table */}
        {trades.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <EmptyState
              icon={<NoTradesIcon />}
              title="معامله‌ای یافت نشد"
              description="هنوز معامله‌ای ثبت نکرده‌اید. برای شروع، فایل متاتریدر را بارگذاری کنید یا معامله جدید اضافه کنید."
              action={
                <div className="flex gap-3">
                  <Link href="/dashboard/trades/upload">
                    <Button>بارگذاری فایل</Button>
                  </Link>
                  <Link href="/dashboard/trades/new">
                    <Button variant="outline">افزودن دستی</Button>
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              dir="ltr"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="زمان بسته شدن معامله"
                      >
                        Close Time
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="نماد معاملاتی"
                      >
                        Symbol
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="خرید یا فروش"
                      >
                        Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="حجم معامله"
                      >
                        Volume
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="قیمت باز شدن"
                      >
                        Open
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="قیمت بسته شدن"
                      >
                        Close
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="سود یا زیان"
                      >
                        Profit/Loss
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        title="ستاپ معاملاتی"
                      >
                        Setups
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trades.map((trade) => {
                      const isEditing = editingTradeId === trade._id;
                      return (
                        <tr key={trade._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm whitespace-pre-line">
                            {formatDateTime(trade.closeTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {trade.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                trade.type === "buy"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                              title={trade.type === "buy" ? "خرید" : "فروش"}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {trade.volume}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {trade.openPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {trade.closePrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-bold ${
                                trade.profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              ${trade.profit.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {trade.setupIds && trade.setupIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trade.setupIds.map((setup) => (
                                  <span
                                    key={setup._id || setup}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                    title={setup.description || setup.title}
                                  >
                                    {setup.type === "standard" ? "⭐" : "👤"}{" "}
                                    {setup.title || setup}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No setup
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-medium"
                                onClick={() => startEditSetups(trade)}
                                title="مدیریت ستاپ‌ها"
                              >
                                📊 Setup
                              </button>
                              <Link
                                href={`/dashboard/trades/edit/${trade._id}`}
                              >
                                <button
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                                  title="ویرایش معامله"
                                >
                                  ✏️ Edit
                                </button>
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedTrade(trade);
                                  setShowDeleteModal(true);
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                                title="حذف معامله"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-6" dir="rtl">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    نمایش {(pagination.page - 1) * pagination.limit + 1} تا{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    از {pagination.total} معامله
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = pagination.page - 1;
                        setPagination((prev) => ({ ...prev, page: newPage }));
                        fetchTrades(user.id, newPage);
                      }}
                      disabled={pagination.page === 1}
                    >
                      قبلی
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setPagination((prev) => ({
                                  ...prev,
                                  page: pageNum,
                                }));
                                fetchTrades(user.id, pageNum);
                              }}
                              className={`px-3 py-1 rounded ${
                                pagination.page === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = pagination.page + 1;
                        setPagination((prev) => ({ ...prev, page: newPage }));
                        fetchTrades(user.id, newPage);
                      }}
                      disabled={pagination.page === pagination.pages}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="حذف معامله"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            آیا مطمئن هستید که می‌خواهید این معامله را حذف کنید؟
          </p>
          {selectedTrade && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm">
                <strong>نماد:</strong> {selectedTrade.symbol}
              </p>
              <p className="text-sm">
                <strong>سود/زیان:</strong> ${selectedTrade.profit.toFixed(2)}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} fullWidth>
              حذف
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              fullWidth
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Setup Management Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          setSelectedTrade(null);
          setShowAddSetup(false);
        }}
        title="مدیریت ستاپ‌های معامله"
        size="lg"
      >
        <div className="space-y-4">
          {selectedTrade && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm">
                <strong>نماد:</strong> {selectedTrade.symbol}
              </p>
              <p className="text-sm">
                <strong>نوع:</strong>{" "}
                {selectedTrade.type === "buy" ? "خرید" : "فروش"}
              </p>
              <p className="text-sm">
                <strong>سود/زیان:</strong> ${selectedTrade.profit?.toFixed(2)}
              </p>
            </div>
          )}

          {/* Current Setups */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              ستاپ‌های فعلی:
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTrade?.setupIds && selectedTrade.setupIds.length > 0 ? (
                selectedTrade.setupIds.map((setup) => (
                  <span
                    key={setup._id || setup}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {setup.title || setup}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">
                  هیچ ستاپی انتخاب نشده
                </span>
              )}
            </div>
          </div>

          {/* Add New Setup Button */}
          <button
            type="button"
            onClick={() => setShowAddSetup(!showAddSetup)}
            className="w-full px-4 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            {showAddSetup ? "❌ لغو" : "➕ افزودن ستاپ جدید"}
          </button>

          {/* Add Setup Form */}
          {showAddSetup && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <input
                type="text"
                value={newSetup.title}
                onChange={(e) =>
                  setNewSetup({ ...newSetup, title: e.target.value })
                }
                placeholder="عنوان ستاپ (مثال: Breakout Strategy)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <textarea
                value={newSetup.description}
                onChange={(e) =>
                  setNewSetup({ ...newSetup, description: e.target.value })
                }
                placeholder="توضیحات ستاپ (اختیاری)"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              />
              <button
                type="button"
                onClick={handleAddSetup}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                ✅ ذخیره ستاپ
              </button>
            </div>
          )}

          {/* Select Setups */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              انتخاب ستاپ‌ها:
            </h4>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {setups.map((setup) => (
                  <button
                    key={setup._id}
                    type="button"
                    onClick={() => toggleSetup(setup._id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSetups.includes(setup._id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {setup.type === "standard" ? "⭐" : "👤"} {setup.title}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⭐ ستاپ‌های استاندارد | 👤 ستاپ‌های شخصی
            </p>
            <SelectedSetupNote setups={setups} selectedIds={selectedSetups} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={saveSetups} fullWidth>
              ✅ ذخیره تغییرات
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowSetupModal(false);
                setSelectedTrade(null);
                setShowAddSetup(false);
              }}
              fullWidth
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
