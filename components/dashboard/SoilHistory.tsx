"use client";

import { useState, useEffect } from "react";
import { SoilReadingRecord } from "@/app/dashboard/soil/actions";
import { analyzeSoilReading } from "@/app/dashboard/soil/ai-actions";
import { SoilAnalysisResult } from "@/src/lib/ai/soil-analysis";

interface SoilHistoryProps {
  history: SoilReadingRecord[];
}

export default function SoilHistory({ history }: SoilHistoryProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SoilAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = history[0];

  // Clear previous AI analysis whenever the latest reading changes (e.g. farm switches, or a new reading is saved)
  useEffect(() => {
    setAnalysis(null);
    setError(null);
  }, [latest?.id]);

  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🌱</div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No soil readings yet.</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto">
          Add your first reading using the form above to start monitoring NPK, pH, and moisture trends.
        </p>
      </div>
    );
  }

  const formatVal = (val: number | null, unit: string) => {
    return val !== null && val !== undefined ? `${val}${unit}` : "Not recorded";
  };

  const handleAiAnalysis = async () => {
    if (!latest?.id || !latest?.farm_id) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeSoilReading(latest.id, latest.farm_id);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setAnalysis(result.data);
      }
    } catch (err) {
      setError("Unable to analyze soil right now. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/50";
      case "moderate":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
      case "poor":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/50";
      case "insufficient_data":
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Latest Soil Reading Card */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Latest Soil Reading</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Prominent summary of your farm's most recent soil health assessment.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
              Recorded: {new Date(latest.recorded_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing Soil...
                </>
              ) : (
                <>✨ Analyze with AI</>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* pH */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">🧪</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">pH</span>
            <span className={`text-base font-bold ${latest.ph !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {latest.ph !== null ? latest.ph : "Not recorded"}
            </span>
          </div>

          {/* Nitrogen */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">🧬</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Nitrogen</span>
            <span className={`text-base font-bold ${latest.nitrogen !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.nitrogen, " mg/kg")}
            </span>
          </div>

          {/* Phosphorus */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">🧬</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Phosphorus</span>
            <span className={`text-base font-bold ${latest.phosphorus !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.phosphorus, " mg/kg")}
            </span>
          </div>

          {/* Potassium */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">🧬</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Potassium</span>
            <span className={`text-base font-bold ${latest.potassium !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.potassium, " mg/kg")}
            </span>
          </div>

          {/* Moisture */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">💧</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Moisture</span>
            <span className={`text-base font-bold ${latest.moisture !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.moisture, "%")}
            </span>
          </div>

          {/* Temperature */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xl mb-1">🌡️</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Temp</span>
            <span className={`text-base font-bold ${latest.temperature !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.temperature, "°C")}
            </span>
          </div>

          {/* Organic Carbon */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center col-span-2 sm:col-span-1">
            <span className="text-xl mb-1">🪨</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Carbon</span>
            <span className={`text-base font-bold ${latest.organic_carbon !== null ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 text-xs font-normal"}`}>
              {formatVal(latest.organic_carbon, "%")}
            </span>
          </div>
        </div>
      </div>

      {/* AI Analysis Result Section */}
      {(analysis || error) && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Soil Health Analysis</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Powered by Gemini advisory models</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Overall status and score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white">Overall Status:</span>
                  <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full ${getStatusColor(analysis.overall_status)}`}>
                    {analysis.overall_status.replace("_", " ")}
                  </span>
                </div>
                
                {analysis.overall_status !== "insufficient_data" && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Health Score</span>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{analysis.overall_score}/100</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">AI Confidence</span>
                      <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{analysis.confidence}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Assessment */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Summary Assessment</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Insufficient Data warning */}
              {analysis.overall_status === "insufficient_data" && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-500">
                  ⚠️ **Insufficient data for a reliable soil assessment.** Please provide more parameters (NPK, moisture, pH) in your manual soil form logs to receive customized recommendations.
                </div>
              )}

              {/* Detail parameters assessments */}
              {analysis.overall_status !== "insufficient_data" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1">🧪 pH Assessment</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.ph_assessment}</p>
                  </div>
                  
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1">🧬 Nutrient Status</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.nutrient_assessment}</p>
                  </div>

                  <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1">💧 Moisture & Temp</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.moisture_assessment}</p>
                  </div>
                </div>
              )}

              {/* Observations, concerns, suggested actions */}
              {analysis.overall_status !== "insufficient_data" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Key Observations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Observations</h4>
                    <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                      {analysis.key_observations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Concerns */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Potential Concerns</h4>
                    <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                      {analysis.concerns.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Actions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Suggested Actions</h4>
                    <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                      {analysis.suggested_actions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed italic text-center">
                AI-generated soil assessment for informational purposes only. For critical agricultural decisions, consult a qualified agricultural expert or laboratory soil test.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Soil Readings History List */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Recent Soil Readings</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="pb-3 font-semibold pr-4">Date / Time</th>
                <th className="pb-3 font-semibold px-4 text-center">pH</th>
                <th className="pb-3 font-semibold px-4 text-center">N (mg/kg)</th>
                <th className="pb-3 font-semibold px-4 text-center">P (mg/kg)</th>
                <th className="pb-3 font-semibold px-4 text-center">K (mg/kg)</th>
                <th className="pb-3 font-semibold px-4 text-center">Moisture</th>
                <th className="pb-3 font-semibold px-4 text-center">Temp</th>
                <th className="pb-3 font-semibold pl-4 text-center">Carbon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {history.map((record) => (
                <tr key={record.id} className="text-zinc-700 dark:text-zinc-300">
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {new Date(record.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(record.recorded_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {record.ph !== null ? record.ph : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.nitrogen !== null ? record.nitrogen : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.phosphorus !== null ? record.phosphorus : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.potassium !== null ? record.potassium : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.moisture !== null ? `${record.moisture}%` : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.temperature !== null ? `${record.temperature}°C` : "-"}
                  </td>
                  <td className="py-3 pl-4 text-center">
                    {record.organic_carbon !== null ? `${record.organic_carbon}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
