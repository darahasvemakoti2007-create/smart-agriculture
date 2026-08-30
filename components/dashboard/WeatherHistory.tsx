"use client";

import { WeatherRecord } from "@/app/dashboard/weather/actions";

interface WeatherHistoryProps {
  history: WeatherRecord[];
}

export default function WeatherHistory({ history }: WeatherHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm text-center">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Recent Weather</h3>
        <p className="text-zinc-500 dark:text-zinc-400">No weather history yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Recent Weather</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="pb-3 font-semibold pr-4">Date / Time</th>
              <th className="pb-3 font-semibold px-4">Condition</th>
              <th className="pb-3 font-semibold text-right px-4">Temp</th>
              <th className="pb-3 font-semibold text-right px-4">Humidity</th>
              <th className="pb-3 font-semibold text-right px-4">Rain Prob.</th>
              <th className="pb-3 font-semibold text-right pl-4">Wind</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {history.map((record) => (
              <tr key={record.id} className="text-zinc-700 dark:text-zinc-300">
                <td className="py-3 pr-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {new Date(record.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(record.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 capitalize flex items-center gap-2">
                  <span className="text-lg">
                    {record.weather_condition.toLowerCase().includes("rain") ? "🌧️" 
                      : record.weather_condition.toLowerCase().includes("cloud") ? "☁️" 
                      : record.weather_condition.toLowerCase().includes("clear") ? "☀️" 
                      : "🌤️"}
                  </span>
                  {record.weather_condition}
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  {Math.round(record.temperature)}°C
                </td>
                <td className="py-3 px-4 text-right">
                  {Math.round(record.humidity)}%
                </td>
                <td className="py-3 px-4 text-right">
                  {record.rain_probability}%
                </td>
                <td className="py-3 pl-4 text-right">
                  {Math.round(record.wind_speed * 3.6)} km/h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
