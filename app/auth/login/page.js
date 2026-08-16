"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { LoadingSpinner } from "@/components/Loading";
import {
  buildSupportRedirect,
  isInactiveAccountError,
} from "@/utils/supportRedirect";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";
  const [loginMethod, setLoginMethod] = useState("otp"); // 'otp' or 'password'
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectInactiveToSupport = (message) => {
    if (!isInactiveAccountError(message)) return false;
    setError(message);
    router.push(
      buildSupportRedirect({
        phone,
        category: "account_activation",
        reason: "inactive",
      }),
    );
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginMethod === "otp") {
        // Send OTP
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (redirectInactiveToSupport(data.error)) return;
          throw new Error(data.error || "خطا در ارسال کد");
        }

        // Redirect to verify page with phone number
        const q = new URLSearchParams({ phone });
        if (nextPath !== "/dashboard") q.set("next", nextPath);
        router.push(`/auth/verify?${q.toString()}`);
      } else {
        // Login with password
        const response = await fetch("/api/auth/login-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (redirectInactiveToSupport(data.error)) return;
          throw new Error(data.error || "خطایی رخ داد");
        }

        // Store user and token
        localStorage.setItem("user", JSON.stringify(data.user));
        const oneWeekFromNow = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem("tokenExpiry", oneWeekFromNow.toString());

        router.push(nextPath);
      }
    } catch (err) {
      if (redirectInactiveToSupport(err.message)) return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex flex-col items-center gap-3 mb-4"
          >
            <div className="logo-">
              <Image
                src="/icons/tradingwall-icon-dark.png"
                alt="Trading Wall Logo"
                width={80}
                height={80}
                className="w-18 h-18 md:w-20 md:h-20"
              />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight trading-wall-logo">
              Trading Wall
            </h1>
          </Link>
          <p className="text-gray-400">ورود / ثبت نام</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("otp");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                loginMethod === "otp"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ورود با کد OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("password");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                loginMethod === "password"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ورود با رمز عبور
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="phone"
                className="block text-lg font-semibold text-gray-800 mb-2"
              >
                شماره موبایل
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                required
                dir="ltr"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>

            {loginMethod === "password" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-lg font-semibold text-gray-800 mb-2"
                >
                  رمز عبور
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                  dir="ltr"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
            )}

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-medium">{error}</p>
                {isInactiveAccountError(error) && (
                  <Link
                    href={buildSupportRedirect({
                      phone,
                      category: "account_activation",
                      reason: "inactive",
                    })}
                    className="inline-block text-sm text-primary-600 hover:underline font-medium"
                  >
                    ارسال درخواست فعال‌سازی به پشتیبانی →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 text-lg font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {loginMethod === "otp" ? "در حال ارسال..." : "در حال ورود..."}
                </span>
              ) : loginMethod === "otp" ? (
                "ارسال کد تایید"
              ) : (
                "ورود"
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 text-center bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              💡 برای ورود یا ثبت نام، شماره موبایل خود را وارد کنید.
              {loginMethod === "otp" && " کد تایید برای شما ارسال خواهد شد."}
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="text-white text-center">در حال بارگذاری...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
