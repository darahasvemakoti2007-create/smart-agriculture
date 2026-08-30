"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function TrustSection() {
  const { t } = useLanguage();
  const stats = [
    { label: t("diseaseTitle"), icon: "🧠" },
    { label: t("weatherTitle"), icon: "🌦️" },
    { label: t("soilTitle"), icon: "🪨" },
    { label: t("irrigationTitle"), icon: "💧" },
  ];

  return (
    <section className="py-10 border-y border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="text-2xl sm:text-xl grayscale opacity-80">{stat.icon}</span>
              <span className="text-sm sm:text-base">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
