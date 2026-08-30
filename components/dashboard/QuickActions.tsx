"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

interface QuickActionItem {
  title: string;
  description: string;
  icon: string;
  tag: string;
  href: string;
}

const actions: QuickActionItem[] = [
  {
    title: "Analyze Crop",
    description: "Upload leaf or plant photo for instant AI diagnosis",
    icon: "🔬",
    tag: "AI Vision",
    href: "/dashboard/disease",
  },
  {
    title: "Check Weather",
    description: "View localized microclimate forecast & rain warnings",
    icon: "🌦",
    tag: "Forecast",
    href: "/dashboard/weather",
  },
  {
    title: "Check Soil",
    description: "Review NPK levels, moisture and pH telemetry",
    icon: "🧪",
    tag: "Telemetry",
    href: "/dashboard/soil",
  },
  {
    title: "Get Irrigation Advice",
    description: "Calculate optimal watering volume and schedules",
    icon: "💧",
    tag: "Smart Water",
    href: "/dashboard/irrigation",
  },
  {
    title: "View History",
    description: "Explore soil trends, disease logs & crop timelines",
    icon: "📊",
    tag: "Analytics",
    href: "/dashboard/history",
  },
  {
    title: "AI Planting Calendar",
    description: "Get a 6-month AI crop plan tailored to your soil & weather",
    icon: "🗓",
    tag: "✨ Unique AI",
    href: "/dashboard/planting-calendar",
  },
];

export default function QuickActions() {
  const { t } = useLanguage();

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {t("quickActions")}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {t("fastAccessTools")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-2xs hover:border-green-300 dark:hover:border-green-800/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                  {action.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {action.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 dark:text-green-400 font-bold">Go to tool</span>
              <span className="group-hover:translate-x-1 transition-transform text-green-600 dark:text-green-400 font-bold">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
