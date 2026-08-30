"use client";

import { useState } from "react";
import { AlertRecord, markAlertRead } from "@/app/dashboard/alerts/actions";

interface AlertsListProps {
  initialAlerts: AlertRecord[];
}

export default function AlertsList({ initialAlerts }: AlertsListProps) {
  const [alerts, setAlerts] = useState<AlertRecord[]>(initialAlerts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const handleMarkAsRead = async (id: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await markAlertRead(id);
      if (res.error) {
        setError(res.error);
      } else {
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === id ? { ...alert, is_read: true } : alert))
        );
      }
    } catch (err) {
      setError("An unexpected error occurred while marking the alert as read.");
    } finally {
      setLoadingId(null);
    }
  };

  // Filtered alerts logic
  const filteredAlerts = alerts.filter((alert) => {
    // Severity Filter
    if (severityFilter === "unread" && alert.is_read) return false;
    if (severityFilter !== "all" && severityFilter !== "unread" && alert.severity !== severityFilter) return false;

    // Type Filter
    if (typeFilter !== "all" && alert.alert_type !== typeFilter) return false;

    return true;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "high":
        return "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      case "medium":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case "low":
      default:
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "disease":
        return "🔍";
      case "weather":
        return "🌦";
      case "soil":
        return "🪨";
      case "irrigation":
        return "💧";
      case "general":
      default:
        return "🚨";
    }
  };

  const totalUnread = alerts.filter((a) => !a.is_read).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Total Alerts</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">{alerts.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Unread Alerts</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">{totalUnread}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xl">
            🚨
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Unread Critical</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">{criticalCount}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm font-medium text-red-800 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-4">
        {/* Severity filter */}
        <div className="space-y-1.5 flex-1">
          <label htmlFor="severity-filter" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Severity Filter
          </label>
          <div className="flex flex-wrap gap-1.5" id="severity-filter">
            {[
              { id: "all", label: "All Alerts" },
              { id: "unread", label: "Unread Only" },
              { id: "critical", label: "Critical" },
              { id: "high", label: "High" },
              { id: "medium", label: "Medium" },
              { id: "low", label: "Low" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSeverityFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  severityFilter === opt.id
                    ? "bg-green-600 border-green-650 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-655 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="space-y-1.5 w-full sm:w-48 shrink-0">
          <label htmlFor="type-filter" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Alert Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
          >
            <option value="all">All Types</option>
            <option value="disease">Disease Detection</option>
            <option value="weather">Weather Warnings</option>
            <option value="soil">Soil Telemetry</option>
            <option value="irrigation">Irrigation Runs</option>
            <option value="general">General platform</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[200px]">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-650 mb-1">No alerts match these filters.</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-xs">
              Any weather notifications, soil moisture warnings, or disease alerts matching this status will display here.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 ${
                alert.is_read
                  ? "border-zinc-200 dark:border-zinc-800 opacity-60"
                  : "border-zinc-300 dark:border-zinc-700 hover:shadow-sm"
              }`}
            >
              {/* Highlight bar for unread critical alerts */}
              {!alert.is_read && alert.severity === "critical" && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-650" />
              )}
              {!alert.is_read && alert.severity === "high" && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />
              )}

              <div className="flex gap-4 items-start flex-1 min-w-0">
                <div className="text-2xl mt-0.5 shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 shadow-2xs">
                  {getTypeIcon(alert.alert_type)}
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getSeverityStyles(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {alert.alert_type}
                    </span>
                    {!alert.is_read && (
                      <span className="text-[9px] font-bold tracking-wide text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 px-1.5 py-0.25 rounded-md">
                        NEW
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight truncate">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    <span className="flex items-center gap-1">
                      🏡 {alert.farms?.farm_name || "Unknown Farm"}
                    </span>
                    <span className="flex items-center gap-1">
                      🌿 {alert.crops?.crop_name || "Farm-level alert"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      🕒 {new Date(alert.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {!alert.is_read && (
                <div className="shrink-0 flex items-center md:pl-4">
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    disabled={loadingId === alert.id}
                    className="w-full md:w-auto px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-755 dark:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    {loadingId === alert.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Updating...
                      </>
                    ) : (
                      "Mark as Read"
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
