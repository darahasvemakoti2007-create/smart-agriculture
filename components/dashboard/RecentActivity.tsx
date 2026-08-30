"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface ActivityItem {
  id: string;
  type: "alert" | "soil" | "disease";
  title: string;
  description: string;
  timestamp: string;
  severity?: "low" | "medium" | "high" | "critical" | "moderate";
  href?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getRelativeTime = (isoString: string) => {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays === 1) return "Yesterday";
    return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIcon = (type: "alert" | "soil" | "disease") => {
    switch (type) {
      case "alert":
        return "🚨";
      case "soil":
        return "🌱";
      case "disease":
        return "🦠";
      default:
        return "📋";
    }
  };

  const getSeverityStyle = (severity?: string) => {
    if (!severity) return "";
    switch (severity) {
      case "critical":
        return "text-red-650 dark:text-red-400 font-bold";
      case "high":
        return "text-orange-500 dark:text-orange-400 font-semibold";
      case "medium":
      case "moderate":
        return "text-amber-600 dark:text-amber-400 font-medium";
      case "low":
      default:
        return "text-blue-500 dark:text-blue-400";
    }
  };

  return (
    <section className="mt-8 mb-12">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Recent Activity
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          History of diagnoses, telemetry updates, and farm alerts
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 sm:p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 text-xl flex items-center justify-center mb-3">
            📋
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            No recent activity yet
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            Your farm activity will appear here as you record soil readings, analyze crops, and receive alerts.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden shadow-2xs">
          {activities.map((act) => {
            const content = (
              <div className="flex items-start gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                <div className="text-2xl w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-center shrink-0">
                  {getIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className={`text-sm font-bold text-zinc-900 dark:text-white truncate ${getSeverityStyle(act.severity)}`}>
                      {act.title}
                    </h3>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-550 whitespace-nowrap shrink-0 font-medium">
                      {mounted ? getRelativeTime(act.timestamp) : "..."}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            );

            return act.href ? (
              <Link key={act.id} href={act.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={act.id}>{content}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
