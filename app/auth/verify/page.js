"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  buildSupportRedirect,
  isInactiveAccountError,
} from "@/utils/supportRedirect";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes

  useEffect(() => {
    if (!phone) {
      router.push("/auth/login");
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phone, router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (isInactiveAccountError(data.error)) {
          router.push(
            buildSupportRedirect({
              phone,
              category: "account_activation",
              reason: "inactive",
            }),
          );
          return;
        }
        throw new Error(data.error || "کد تایید نامعتبر است");
      }

      // Store user in localStorage with 1 week expiry
      localStorage.setItem("user", JSON.stringify(data.user));
      const oneWeekFromNow = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
      localStorage.setItem("tokenExpiry", oneWeekFromNow.toString());

      // Redirect after login
      router.push(nextPath);
    } catch (err) {
      if (isInactiveAccountError(err.message)) {
        router.push(
          buildSupportRedirect({
            phone,
            category: "account_activation",
            reason: "inactive",
          }),
        );
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (isInactiveAccountError(data.error)) {
          router.push(
            buildSupportRedirect({
              phone,
              category: "account_activation",
              reason: "inactive",
            }),
          );
          return;
        }
        throw new Error(data.error || "خطا در ارسال کد");
      }

      setResendTimer(120);
    } catch (err) {
      if (isInactiveAccountError(err.message)) {
        router.push(
          buildSupportRedirect({
            phone,
            category: "account_activation",
            reason: "inactive",
          }),
        );
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 mb-4"
          >
            <div className="logo-badge">
              <Image
                src="/icons/tradingwall-icon-dark.png"
                alt="Trading Wall Logo"
                width={72}
                height={72}
                className="w-16 h-16 md:w-18 md:h-18"
              />
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            تایید شماره موبایل
          </h1>
          <p className="text-gray-400">
            کد ارسال شده به شماره{" "}
            <span className="text-white font-bold">{phone}</span> را وارد کنید
          </p>
        </div>

        {/* Verify Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-lg font-semibold text-gray-800 mb-2 text-center"
              >
                کد تایید
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="12345"
                required
                dir="ltr"
                maxLength={5}
                className="w-full px-4 py-4 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 tracking-widest"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 5}
              className="w-full px-6 py-4 text-lg font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  در حال تایید...
                </span>
              ) : (
                "تایید و ورود"
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            {resendTimer > 0 ? (
              <p className="text-gray-700 text-base font-medium">
                ارسال مجدد کد تا {formatTime(resendTimer)}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-primary-600 hover:text-primary-700 font-semibold text-base"
              >
                ارسال مجدد کد
              </button>
            )}
          </div>

          {/* Back Link */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              تغییر شماره موبایل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-white text-center">در حال بارگذاری...</div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
