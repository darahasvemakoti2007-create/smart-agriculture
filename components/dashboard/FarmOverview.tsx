"use client";

import Link from "next/link";
import { Farm } from "@/components/dashboard/FarmCard";
import { useLanguage } from "@/components/LanguageContext";

interface FarmOverviewProps {
  farms?: Farm[];
}

export default function FarmOverview({ farms = [] }: FarmOverviewProps) {
  const hasFarms = farms.length > 0;
  const { t } = useLanguage();

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("farmOverview")}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {t("locationSizeSoil")}
          </p>
        </div>
        {hasFarms && (
          <Link
            href="/dashboard/farm"
            className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
          >
            Manage Farms ({farms.length}) →
          </Link>
        )}
      </div>

      {hasFarms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.slice(0, 3).map((farm) => (
            <div
              key={farm.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-2xs hover:border-green-300 dark:hover:border-green-800/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏡</span>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                    {farm.farm_name}
                  </h3>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {farm.location ? `📍 ${farm.location}` : "Location not specified"}
              </p>
              <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-900 flex justify-between text-[11px] text-zinc-500">
                <span>{farm.area ? `${farm.area} ${farm.area_unit || "acres"}` : "Area unset"}</span>
                <span>{farm.soil_type || "Soil unset"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-3xl flex items-center justify-center mb-4">
            🚜
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
            No farm has been added yet.
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Add your farm details to start receiving personalized agricultural insights, customized irrigation schedules, and weather alerts.
          </p>
          <Link
            href="/dashboard/farm"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <span>+</span>
            <span>Add Your Farm</span>
          </Link>
        </div>
      )}
    </section>
  );
}
