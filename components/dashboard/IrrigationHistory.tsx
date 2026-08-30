"use client";

import { IrrigationHistoryRecord } from "@/app/dashboard/irrigation/actions";

interface IrrigationHistoryProps {
  history: IrrigationHistoryRecord[];
}

export default function IrrigationHistory({ history }: IrrigationHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-center shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Irrigation History</h3>
        <p className="text-zinc-500 dark:text-zinc-400">No irrigation records logged yet.</p>
      </div>
    );
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "N/A";
    const parsed = Date.parse(timeStr);
    if (isNaN(parsed)) return timeStr;
    return new Date(parsed).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Irrigation History</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="pb-3 font-semibold pr-4">Log Date</th>
              <th className="pb-3 font-semibold px-4">Crop</th>
              <th className="pb-3 font-semibold px-4 text-center">Moisture</th>
              <th className="pb-3 font-semibold px-4">Recommendation Details</th>
              <th className="pb-3 font-semibold px-4">Rec. Time</th>
              <th className="pb-3 font-semibold px-4 text-right">Duration</th>
              <th className="pb-3 font-semibold pl-4 text-right">Confidence</th>
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
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  {record.crops?.crop_name || "Unknown Crop"}
                </td>
                <td className="py-3 px-4 text-center">
                  {record.soil_moisture !== null ? `${Math.round(record.soil_moisture)}%` : "N/A"}
                </td>
                <td className="py-3 px-4 max-w-[200px] truncate text-xs text-zinc-550 dark:text-zinc-400" title={record.recommendation}>
                  {record.recommendation}
                </td>
                <td className="py-3 px-4 text-xs">
                  {formatTime(record.recommended_time)}
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  {record.estimated_duration_minutes !== null ? `${record.estimated_duration_minutes} min` : "0 min"}
                </td>
                <td className="py-3 pl-4 text-right">
                  {record.confidence !== null ? `${record.confidence}%` : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
