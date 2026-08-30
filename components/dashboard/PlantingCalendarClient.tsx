"use client";

import { useState } from "react";
import { generatePlantingCalendar, PlantingCalendarResult, CalendarTask } from "@/app/dashboard/planting-calendar/actions";

interface Props {
  farms: { id: string; farm_name: string }[];
}

const taskColors: Record<string, { bg: string; text: string; icon: string }> = {
  plant:     { bg: "bg-green-100 dark:bg-green-950/40",    text: "text-green-700 dark:text-green-400",  icon: "🌱" },
  water:     { bg: "bg-blue-100 dark:bg-blue-950/40",      text: "text-blue-700 dark:text-blue-400",    icon: "💧" },
  fertilize: { bg: "bg-amber-100 dark:bg-amber-950/40",    text: "text-amber-700 dark:text-amber-400",  icon: "🧪" },
  harvest:   { bg: "bg-yellow-100 dark:bg-yellow-950/40",  text: "text-yellow-700 dark:text-yellow-400",icon: "🌾" },
  inspect:   { bg: "bg-purple-100 dark:bg-purple-950/40",  text: "text-purple-700 dark:text-purple-400",icon: "🔬" },
  spray:     { bg: "bg-red-100 dark:bg-red-950/40",        text: "text-red-700 dark:text-red-400",      icon: "🌿" },
};

const difficultyBadge: Record<string, string> = {
  easy:   "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  hard:   "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

function TaskBadge({ task }: { task: CalendarTask }) {
  const style = taskColors[task.type] || taskColors.inspect;
  return (
    <div className={`rounded-lg px-2.5 py-2 ${style.bg} group relative cursor-default`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{style.icon}</span>
        <span className={`text-[10px] font-bold leading-tight ${style.text}`}>{task.label}</span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-1 w-52 p-2 rounded-lg bg-zinc-900 text-white text-[10px] leading-relaxed z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        <p className="font-bold mb-0.5">{task.label}</p>
        <p>{task.detail}</p>
      </div>
    </div>
  );
}

export default function PlantingCalendarClient({ farms }: Props) {
  const [selectedFarm, setSelectedFarm] = useState(farms[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantingCalendarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState(0);

  const handleGenerate = async () => {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await generatePlantingCalendar(selectedFarm);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res.data!);
    setActiveMonth(0);
  };

  const currentCalendar = result?.calendar[activeMonth];

  return (
    <div className="space-y-8">
      {/* Config Panel */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Select Farm
            </label>
            {farms.length === 0 ? (
              <p className="text-sm text-red-500">No farms found. Please register a farm first.</p>
            ) : (
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600/20 text-zinc-800 dark:text-zinc-200"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.farm_name}</option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || farms.length === 0}
            className="shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating…
              </>
            ) : (
              <>✨ Generate AI Calendar</>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-5 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/30 text-sm text-green-700 dark:text-green-400 flex items-center gap-3">
            <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Gemini AI is analyzing your soil, weather & location to build a personalized 6-month farm plan…
          </div>
        )}

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-sm text-red-700 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Crop Recommendations */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🌾</span>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">AI Crop Recommendations</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Optimized for {result.location} · {result.soilType} soil
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 hover:border-green-200 dark:hover:border-green-800/50 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{rec.cropName}</h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{rec.variety}</p>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${difficultyBadge[rec.difficulty]}`}>
                      {rec.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{rec.reason}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">📦 {rec.expectedYield}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">🗓 {rec.season}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Month Calendar */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">📅</span>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">6-Month Planting Calendar</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Hover over tasks for detailed instructions</p>
              </div>
              <div className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">
                Generated {result.generatedOn}
              </div>
            </div>

            {/* Month tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {result.calendar.map((month, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMonth(i)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMonth === i
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {month.month}
                </button>
              ))}
            </div>

            {/* Active month view */}
            {currentCalendar && (
              <div>
                {/* Month tip */}
                <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 flex items-start gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">{currentCalendar.tip}</p>
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {currentCalendar.tasks.sort((a, b) => a.day - b.day).map((task, i) => {
                    const style = taskColors[task.type] || taskColors.inspect;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors group"
                      >
                        {/* Day badge */}
                        <div className={`shrink-0 w-10 h-10 rounded-xl ${style.bg} flex flex-col items-center justify-center`}>
                          <span className="text-lg leading-none">{style.icon}</span>
                          <span className={`text-[9px] font-extrabold ${style.text}`}>Day {task.day}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-bold ${style.text}`}>{task.label}</p>
                            {task.crop && (
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-md">
                                {task.crop}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{task.detail}</p>
                        </div>

                        <span className={`shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                          {task.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Activity Legend</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(taskColors).map(([type, style]) => (
                <span key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                  {style.icon} {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state - no results yet */}
      {!result && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-16 text-center">
          <div className="text-5xl mb-4">🗓</div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Your personalized farm calendar awaits</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Select your farm and click <strong>"Generate AI Calendar"</strong> to get a 6-month personalized planting plan powered by Gemini AI, based on your actual soil data, location, and weather.
          </p>
        </div>
      )}
    </div>
  );
}
