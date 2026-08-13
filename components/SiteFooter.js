"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/utils/session";

/** Deterministic pseudo-random candle heights for SSR-stable render */
const CANDLES = [
  { h: 28, up: true, wick: 10 },
  { h: 42, up: false, wick: 14 },
  { h: 36, up: true, wick: 8 },
  { h: 22, up: true, wick: 12 },
  { h: 48, up: false, wick: 16 },
  { h: 32, up: true, wick: 9 },
  { h: 40, up: false, wick: 11 },
  { h: 26, up: true, wick: 7 },
  { h: 44, up: true, wick: 15 },
  { h: 30, up: false, wick: 10 },
  { h: 38, up: true, wick: 13 },
  { h: 24, up: false, wick: 8 },
  { h: 46, up: true, wick: 14 },
  { h: 34, up: false, wick: 11 },
  { h: 29, up: true, wick: 9 },
  { h: 41, up: false, wick: 12 },
  { h: 33, up: true, wick: 10 },
  { h: 27, up: true, wick: 8 },
  { h: 45, up: false, wick: 15 },
  { h: 31, up: true, wick: 11 },
  { h: 39, up: false, wick: 13 },
  { h: 25, up: true, wick: 7 },
  { h: 43, up: true, wick: 14 },
  { h: 35, up: false, wick: 10 },
];

const BASE_FOOTER_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/leaderboards", label: "لیدربورد" },
  { href: "/dashboard", label: "داشبورد" },
  { href: "/profile", label: "پروفایل" },
];

function Candle({ h, up, wick, delay }) {
  const bodyColor = up ? "bg-emerald-500/70" : "bg-rose-500/60";
  const wickColor = up ? "bg-emerald-400/50" : "bg-rose-400/45";

  return (
    <div
      className="candle-bar flex flex-col items-center justify-end"
      style={{ height: 56, animationDelay: `${delay}ms` }}
    >
      <div className={`w-px ${wickColor}`} style={{ height: wick * 0.45 }} />
      <div
        className={`w-[3px] sm:w-1 rounded-[1px] ${bodyColor}`}
        style={{ height: h * 0.7 }}
      />
      <div className={`w-px ${wickColor}`} style={{ height: wick * 0.35 }} />
    </div>
  );
}

/**
 * Site-wide candle-themed footer — matches dark navy / chart palette
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getSessionUser());
  }, []);

  const footerLinks = isLoggedIn
    ? BASE_FOOTER_LINKS
    : [...BASE_FOOTER_LINKS, { href: "/auth/login", label: "ورود" }];

  return (
    <footer className="site-footer relative mt-auto overflow-hidden border-t border-white/10 bg-gradient-to-b from-slate-900 via-gray-900 to-[#0b1220] text-gray-300">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(14,165,233,0.18), transparent 70%)",
        }}
      />

      {/* Candlestick strip */}
      <div className="relative border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-[2px] sm:gap-1 h-16 opacity-80">
            {CANDLES.map((c, i) => (
              <Candle key={i} {...c} delay={i * 90} />
            ))}
          </div>
        </div>
        {/* Soft chart baseline */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="logo-badge shrink-0 group-hover:opacity-90 transition-opacity">
                <Image
                  src="/icons/tradingwall-icon-dark.png"
                  alt="Trading Wall"
                  width={40}
                  height={40}
                  className="w-9 h-9 md:w-10 md:h-10"
                />
              </div>
              <div>
                <p className="trading-wall-logo text-white text-sm md:text-base tracking-wide">
                  Trading Wall
                </p>
                <p className="text-xs text-gray-500 mt-0.5">دیوار معاملاتی</p>
              </div>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-primary-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {year} Trading Wall · تمامی حقوق محفوظ است</p>
          <p className="flex items-center gap-2 flex-wrap justify-center order-3 sm:order-none">
            <a
              href="mailto:info@tradingwall.ir"
              className="hover:text-primary-300 transition-colors"
            >
              info@tradingwall.ir
            </a>
            <span className="text-gray-600">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/80" />
              Bull
            </span>
            <span className="text-gray-600">/</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm bg-rose-500/70" />
              Bear
            </span>
            <span className="text-gray-600 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-gray-500">
              تحلیل، ژورنال، رقابت
            </span>
          </p>
          {/* Enamad — بدون rel=noopener/noreferrer (الزام اینماد) */}
          <div className="shrink-0 sm:ms-auto">
            <a
              referrerPolicy="origin"
              target="_blank"
              href="https://trustseal.enamad.ir/?id=7294545&Code=uGy6iTNSKt6P4v1iIJWK2692LAgf4fAO"
            >
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=7294545&Code=uGy6iTNSKt6P4v1iIJWK2692LAgf4fAO"
                alt="نماد اعتماد الکترونیکی"
                style={{ cursor: "pointer" }}
                code="uGy6iTNSKt6P4v1iIJWK2692LAgf4fAO"
                width={125}
                height={125}
                className="w-[72px] h-auto md:w-[88px]"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
