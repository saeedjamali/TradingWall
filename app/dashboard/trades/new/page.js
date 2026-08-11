"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import SymbolSelect from "@/components/SymbolSelect";

export default function NewTradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    positionId: "",
    symbol: "",
    type: "buy",
    volume: "",
    openPrice: "",
    closePrice: "",
    stopLoss: "",
    takeProfit: "",
    openTime: "",
    closeTime: "",
    commission: "0",
    swap: "0",
    profit: "",
    notes: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          positionId: formData.positionId,
          symbol: formData.symbol,
          type: formData.type,
          volume: parseFloat(formData.volume),
          openPrice: parseFloat(formData.openPrice),
          closePrice: parseFloat(formData.closePrice),
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
          takeProfit: formData.takeProfit
            ? parseFloat(formData.takeProfit)
            : null,
          openTime: new Date(formData.openTime),
          closeTime: new Date(formData.closeTime),
          commission: formData.commission ? parseFloat(formData.commission) : 0,
          swap: formData.swap ? parseFloat(formData.swap) : 0,
          profit: parseFloat(formData.profit),
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("معامله با موفقیت اضافه شد");
        router.push("/dashboard/trades");
      } else {
        alert(data.error || "خطایی رخ داده است");
      }
    } catch (error) {
      console.error("Error creating trade:", error);
      alert("خطا در ایجاد معامله");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <Loading text="در حال بارگذاری..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/trades"
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
            <h1 className="text-xl md:text-2xl font-bold">
              افزودن معامله جدید
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
          >
            {/* Position ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position ID <span className="text-red-500">*</span>
              </label>
              <Input
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                placeholder="123456"
                required
              />
            </div>

            {/* Symbol & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <SymbolSelect
                  value={formData.symbol}
                  onChange={(code) =>
                    setFormData((prev) => ({ ...prev, symbol: code }))
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  فقط نمادهای تعریف‌شده در سیستم قابل انتخاب‌اند
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
            </div>

            {/* Volume & Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  placeholder="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="openPrice"
                  value={formData.openPrice}
                  onChange={handleChange}
                  placeholder="43500.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Close Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="closePrice"
                  value={formData.closePrice}
                  onChange={handleChange}
                  placeholder="43550.00"
                  required
                />
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  placeholder="43450.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  name="takeProfit"
                  value={formData.takeProfit}
                  onChange={handleChange}
                  placeholder="43600.00"
                />
              </div>
            </div>

            {/* Open Time & Close Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="openTime"
                  value={formData.openTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Close Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="closeTime"
                  value={formData.closeTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Commission, Swap & Profit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Swap
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="swap"
                  value={formData.swap}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit/Loss <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="profit"
                  value={formData.profit}
                  onChange={handleChange}
                  placeholder="50.00"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="یادداشت‌های اضافی..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving} fullWidth>
                {saving ? "در حال ذخیره..." : "افزودن معامله"}
              </Button>
              <Link href="/dashboard/trades" className="flex-1">
                <Button type="button" variant="ghost" fullWidth>
                  انصراف
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
