"use client";

import { useLanguage } from "@/components/LanguageContext";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
            <span>👋</span>
            <span>Welcome back, {userName}!</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("dashboardTitle")}
          </h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            {t("dashboardSub")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              System Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
