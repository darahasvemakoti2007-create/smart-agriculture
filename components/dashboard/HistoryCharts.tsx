"use client";

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

interface SoilReading {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  ph: number;
  recorded_at: string;
}

interface DiseaseEvent {
  disease_name: string;
  severity: string;
  crop_name: string;
  detected_at: string;
  confidence_score?: number;
}

interface Crop {
  id: string;
  crop_name: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  status: string;
  created_at: string;
}

interface Alert {
  severity: string;
  created_at: string;
  title: string;
}

interface Props {
  soilReadings: SoilReading[];
  diseaseEvents: DiseaseEvent[];
  crops: Crop[];
  alerts: Alert[];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatMonth(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function severityColor(severity: string) {
  const s = (severity || "").toLowerCase();
  if (s === "high" || s === "critical") return "#ef4444";
  if (s === "medium" || s === "moderate") return "#f59e0b";
  return "#22c55e";
}

function severityBadge(severity: string) {
  const s = (severity || "").toLowerCase();
  if (s === "high" || s === "critical")
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/40";
  if (s === "medium" || s === "moderate")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/40";
  return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200/40";
}

// Group alerts by month for bar chart
function groupAlertsByMonth(alerts: Alert[]) {
  const map: Record<string, { month: string; critical: number; medium: number; low: number }> = {};
  alerts.forEach((a) => {
    const month = formatMonth(a.created_at);
    if (!map[month]) map[month] = { month, critical: 0, medium: 0, low: 0 };
    const s = (a.severity || "").toLowerCase();
    if (s === "high" || s === "critical") map[month].critical++;
    else if (s === "medium" || s === "moderate") map[month].medium++;
    else map[month].low++;
  });
  return Object.values(map);
}

export default function HistoryCharts({ soilReadings, diseaseEvents, crops, alerts }: Props) {
  const soilData = soilReadings.map((r) => ({
    date: formatDate(r.recorded_at),
    Nitrogen: r.nitrogen ? Math.round(r.nitrogen) : 0,
    Phosphorus: r.phosphorus ? Math.round(r.phosphorus) : 0,
    Potassium: r.potassium ? Math.round(r.potassium) : 0,
    Moisture: r.moisture ? Math.round(r.moisture) : 0,
    pH: r.ph ? Number(r.ph.toFixed(1)) : 0,
  }));

  const alertTrend = groupAlertsByMonth(alerts);

  const hasNoData = soilData.length === 0 && diseaseEvents.length === 0 && crops.length === 0 && alerts.length === 0;

  if (hasNoData) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">No historical data yet</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Start adding soil readings, scanning crops for disease, and registering farm activity to populate your analytics dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Section 1: Soil NPK Trend ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🪨</span>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Soil NPK Trends</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Nitrogen, Phosphorus & Potassium levels over time</p>
          </div>
        </div>
        {soilData.length === 0 ? (
          <EmptyChart label="No soil readings recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={soilData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gK" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #e4e4e7" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="Nitrogen" stroke="#22c55e" fill="url(#gN)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Phosphorus" stroke="#3b82f6" fill="url(#gP)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Potassium" stroke="#f59e0b" fill="url(#gK)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section 2: Soil Moisture & pH Trend ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">💧</span>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Moisture & pH History</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Soil moisture % and pH readings over time</p>
          </div>
        </div>
        {soilData.length === 0 ? (
          <EmptyChart label="No soil readings recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={soilData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 14]} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #e4e4e7" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line yAxisId="left" type="monotone" dataKey="Moisture" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Moisture (%)" />
              <Line yAxisId="right" type="monotone" dataKey="pH" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="pH Level" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section 3: Alert Trends by Month ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🚨</span>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Pest & Disease Alert History</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly breakdown of alerts by severity</p>
          </div>
        </div>
        {alertTrend.length === 0 ? (
          <EmptyChart label="No alerts recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={alertTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #e4e4e7" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="medium" name="Medium" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="low" name="Low" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section 4: Disease Detection Log ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔬</span>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Disease Detection Log</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">AI-identified diseases across your crops</p>
          </div>
        </div>
        {diseaseEvents.length === 0 ? (
          <EmptyChart label="No disease scans performed yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900">
                  <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3 pr-4">Disease</th>
                  <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3 pr-4">Crop</th>
                  <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3 pr-4">Severity</th>
                  <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {diseaseEvents.map((d, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 pr-4 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(d.detected_at)}</td>
                    <td className="py-3 pr-4 text-sm font-semibold text-zinc-900 dark:text-white">{d.disease_name || "—"}</td>
                    <td className="py-3 pr-4 text-xs text-zinc-600 dark:text-zinc-400">{d.crop_name || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${severityBadge(d.severity)}`}>
                        {d.severity || "low"}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {d.confidence_score ? `${Math.round(d.confidence_score * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 5: Crop Timeline ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🌱</span>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Crop Timeline</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Planting and harvest schedule across all registered crops</p>
          </div>
        </div>
        {crops.length === 0 ? (
          <EmptyChart label="No crops registered yet" />
        ) : (
          <div className="space-y-3">
            {crops.map((crop, i) => {
              const start = crop.planting_date ? new Date(crop.planting_date) : new Date(crop.created_at);
              const end = crop.expected_harvest_date ? new Date(crop.expected_harvest_date) : null;
              const daysTotal = end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) : null;
              const now = new Date();
              const daysPassed = Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000));
              const progress = daysTotal ? Math.min(100, Math.round((daysPassed / daysTotal) * 100)) : null;
              const statusColor = crop.status === "harvested" ? "bg-zinc-400" :
                crop.status === "active" ? "bg-green-500" : "bg-amber-400";

              return (
                <div key={i} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌿</span>
                      <div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{crop.crop_name}</span>
                        {crop.variety && <span className="text-xs text-zinc-400 ml-1.5">({crop.variety})</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{crop.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500 mb-2 flex-wrap">
                    <span>🗓 Planted: {crop.planting_date ? formatDate(crop.planting_date) : "—"}</span>
                    {end && <span>🏁 Harvest: {formatDate(crop.expected_harvest_date!)}</span>}
                    {daysTotal && <span>⏱ {daysTotal} day cycle</span>}
                  </div>
                  {progress !== null && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                        <span>Growth Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${crop.status === "harvested" ? "bg-zinc-400" : "bg-green-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <span className="text-3xl mb-2">📉</span>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
  );
}
