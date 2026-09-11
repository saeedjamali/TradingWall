"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserName } from "@/components/VerifiedBadge";
import { CountBadge, useInboxCounts } from "@/components/useInboxCounts";

const navItems = [
  { href: "/admin", label: "داشبورد", icon: "🏠", exact: true },
  { href: "/admin/users", label: "کاربران", icon: "👥" },
  { href: "/admin/trades", label: "معاملات", icon: "📊" },
  { href: "/admin/symbols", label: "نمادها", icon: "📈" },
  { href: "/admin/setups", label: "ستاپ‌ها", icon: "⚙️" },
  { href: "/admin/blog", label: "بلاگ", icon: "✍️" },
  { href: "/admin/messages", label: "نظرات", icon: "💬" },
  { href: "/admin/demo-data", label: "دیتای دمو", icon: "🧪" },
  { href: "/admin/logs", label: "لاگ", icon: "📋" },
];

export default function AdminHeader({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminInbox } = useInboxCounts({
    userId: user?.id,
    isAdmin: true,
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    router.push("/");
  };

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="logo-badge shrink-0">
                <Image
                  src="/icons/tradingwall-icon-dark.png"
                  alt="Trading Wall Logo"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold truncate">
                  پنل مدیریت
                </h1>
                <p className="hidden sm:block text-slate-300 text-xs tracking-tight trading-wall-logo">
                  Trading Wall Admin
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              title="نمای کاربری"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="hidden md:inline">نمای کاربری</span>
            </Link>
            <UserName
              name={user?.publicName}
              verified={user?.verified}
              className="hidden md:inline-flex text-slate-400 text-sm max-w-[140px]"
              badgeClassName="w-3.5 h-3.5 text-blue-500"
            />
            <button
              onClick={handleLogout}
              title="خروج"
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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

        {/* Sub navigation */}
        <nav className="flex gap-1 md:gap-2 mt-4 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isActive(item)
                  ? "bg-white text-slate-900 font-semibold"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {item.href === "/admin/messages" && (
                <CountBadge count={adminInbox} inline />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
