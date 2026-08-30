"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import FarmAIChat from "@/components/dashboard/FarmAIChat";
import { useLanguage } from "@/components/LanguageContext";

interface SidebarProps {
  userName: string;
  userEmail: string;
}

interface NavItem {
  nameKey: string;
  defaultName: string;
  icon: string;
  href: string;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { nameKey: "navDashboard", defaultName: "Dashboard", icon: "📊", href: "/dashboard" },
  { nameKey: "navMyFarm", defaultName: "My Farm", icon: "🏡", href: "/dashboard/farm" },
  { nameKey: "navCrops", defaultName: "Crops", icon: "🌿", href: "/dashboard/crops" },
  { nameKey: "navDisease", defaultName: "Disease Detection", icon: "🔬", href: "/dashboard/disease" },
  { nameKey: "navWeather", defaultName: "Weather", icon: "🌦", href: "/dashboard/weather" },
  { nameKey: "navSoil", defaultName: "Soil Health", icon: "🪨", href: "/dashboard/soil" },
  { nameKey: "navIrrigation", defaultName: "Irrigation", icon: "💧", href: "/dashboard/irrigation" },
  { nameKey: "navRecommendations", defaultName: "Recommendations", icon: "💡", href: "/dashboard/recommendations" },
  { nameKey: "navAlerts", defaultName: "Alerts", icon: "🚨", href: "/dashboard/alerts" },
  { nameKey: "navHistory", defaultName: "History & Analytics", icon: "📊", href: "/dashboard/history" },
  { nameKey: "navCalendar", defaultName: "AI Planting Calendar", icon: "🗓", href: "/dashboard/planting-calendar" },
];

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{ background: '#070d1a', borderBottom: '1px solid rgba(34,197,94,0.12)' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-green-400 neon-text">
            AgriSync
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation Menu"
          className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 focus:outline-none"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: '#070d1a', borderRight: '1px solid rgba(34,197,94,0.1)' }}
      >
        {/* Top Branding & Nav Links */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <span className="text-xl font-bold tracking-tight text-green-400 neon-text">
                AgriSync
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href) && item.href !== "#";
              const label = t(item.nameKey) || item.defaultName;

              return (
                <div key={item.nameKey}>
                  {!item.comingSoon ? (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        isActive
                          ? "bg-green-500/10 text-green-400 border border-green-500/25 neon-border"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span>{label}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-zinc-600 font-medium text-sm hover:bg-white/5 cursor-not-allowed group">
                      <div className="flex items-center gap-3 opacity-60 group-hover:opacity-80 transition-opacity">
                        <span className="text-lg">{item.icon}</span>
                        <span>{label}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/10">
                        Soon
                      </span>
                    </div>
                  )}

                  {item.nameKey === "navSoil" && (
                    <div className="pl-7 mt-1.5 space-y-1">
                      <Link
                        href="/dashboard/soil/advisory"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          pathname === "/dashboard/soil/advisory"
                            ? "text-green-400 bg-green-500/10 border border-green-500/20"
                            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                      >
                        <span>🔬</span>
                        <span>{t("navFertilizer")}</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {userEmail}
              </p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t("signOut")}</span>
            </button>
          </form>
        </div>
      </aside>
      <FarmAIChat />
    </>
  );
}
