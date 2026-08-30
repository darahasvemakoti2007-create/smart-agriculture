"use client";

import { useState, useEffect } from "react";
import {
  getRecommendationContext,
  getRecommendationsForCrop,
  logAIRecommendation,
  getRecommendationHistory,
  RecommendationContext,
  RecommendationRecord,
} from "@/app/dashboard/recommendations/actions";
import { RecommendationAnalysis } from "@/src/lib/ai/recommendation-engine";

interface Farm {
  id: string;
  farm_name: string;
}

interface Crop {
  id: string;
  farm_id: string;
  crop_name: string;
  status: string;
}

interface RecommendationsListProps {
  farms: Farm[];
  crops: Crop[];
}

export default function RecommendationsList({ farms, crops }: RecommendationsListProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || "");
  const [selectedCropId, setSelectedCropId] = useState<string>("");

  const [context, setContext] = useState<RecommendationContext | null>(null);
  const [analysis, setAnalysis] = useState<RecommendationAnalysis | null>(null);
  const [history, setHistory] = useState<RecommendationRecord[]>([]);

  const [loadingContext, setLoadingContext] = useState<boolean>(false);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter crops by farm
  const farmCrops = crops.filter((c) => c.farm_id === selectedFarmId && c.status === "active");

  // Fetch context and history
  const fetchContextAndHistory = async (farmId: string, cropId: string) => {
    if (!farmId) return;
    setLoadingContext(true);
    setLoadingHistory(true);
    setError(null);
    setHistoryError(null);

    // Fetch Context
    try {
      const res = await getRecommendationContext(farmId, cropId || undefined);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setContext(res.data);
      }
    } catch (err) {
      setError("Failed to load telemetry context preview.");
    } finally {
      setLoadingContext(false);
    }

    // Fetch History
    try {
      const res = await getRecommendationHistory(farmId, cropId || undefined);
      if (res.error) {
        setHistoryError(res.error);
      } else if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      setHistoryError("Unable to load recommendation history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedFarmId) {
      const isValidCrop = farmCrops.some((c) => c.id === selectedCropId);
      const targetCropId = isValidCrop ? selectedCropId : "";
      if (!isValidCrop) setSelectedCropId("");
      fetchContextAndHistory(selectedFarmId, targetCropId);
    }
  }, [selectedFarmId, selectedCropId]);

  const handleGenerate = async () => {
    if (!selectedFarmId) return;
    setLoadingRecs(true);
    setError(null);
    setAnalysis(null);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await getRecommendationsForCrop(selectedFarmId, selectedCropId || undefined);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setAnalysis(res.data);
      }
    } catch (err) {
      setError("Unable to generate recommendations right now. Please try again.");
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSave = async () => {
    if (!analysis || !selectedFarmId) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await logAIRecommendation(selectedFarmId, selectedCropId || null, analysis);
      if (res.error) {
        setSaveError(res.error);
      } else if (res.message === "duplicate") {
        setSaveMessage("These recommendations were already saved recently.");
        // Refresh history to ensure it's up to date
        const historyRes = await getRecommendationHistory(selectedFarmId, selectedCropId || undefined);
        if (historyRes.data) setHistory(historyRes.data);
      } else {
        setSaveMessage("Recommendations saved successfully.");
        // Reload history immediately
        const historyRes = await getRecommendationHistory(selectedFarmId, selectedCropId || undefined);
        if (historyRes.data) setHistory(historyRes.data);
      }
    } catch (err) {
      setSaveError("Unable to save recommendations right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "attention_required":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case "critical":
        return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "insufficient_data":
      default:
        return "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
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
      case "soil":
        return "🌱";
      case "irrigation":
        return "💧";
      case "weather":
        return "🌦️";
      case "disease":
        return "🦠";
      case "general":
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Selectors card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Farm selector */}
          <div className="space-y-1.5">
            <label htmlFor="farm-select" className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
              Selected Farm
            </label>
            <select
              id="farm-select"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  🏡 {f.farm_name}
                </option>
              ))}
            </select>
          </div>

          {/* Crop selector */}
          <div className="space-y-1.5">
            <label htmlFor="crop-select" className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">
              Crop Focus
            </label>
            <select
              id="crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
            >
              <option value="">📂 Farm-level (No specific crop focus)</option>
              {farmCrops.map((c) => (
                <option key={c.id} value={c.id}>
                  🌿 {c.crop_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loadingRecs || !selectedFarmId}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-650 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {loadingRecs ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing farm conditions...
              </>
            ) : (
              "Generate AI Recommendations"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm font-semibold text-red-800 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Main Grid: Context & Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analysis Context */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-2">
              Analysis Context
            </h3>

            {loadingContext ? (
              <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
                Syncing latest telemetry...
              </div>
            ) : context ? (
              <div className="space-y-4 text-xs">
                {/* Farm/Crop Details */}
                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Farm:</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{context.farm.farm_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Crop Focus:</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{context.crop?.crop_name || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Crop Age:</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {context.cropAgeDays !== null ? `${context.cropAgeDays} days` : "Not available"}
                    </span>
                  </div>
                </div>

                {/* Soil Health */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Latest Soil Reading</span>
                  {context.soil ? (
                    <div className="grid grid-cols-2 gap-2 bg-zinc-50/50 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
                      <div>pH: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.ph ?? "N/A"}</span></div>
                      <div>Moisture: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.moisture ? `${context.soil.moisture}%` : "N/A"}</span></div>
                      <div>N: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.nitrogen ?? "N/A"}</span></div>
                      <div>P: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.phosphorus ?? "N/A"}</span></div>
                      <div>K: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.potassium ?? "N/A"}</span></div>
                      <div>Temp: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.soil.temperature ? `${context.soil.temperature}°C` : "N/A"}</span></div>
                    </div>
                  ) : (
                    <p className="text-zinc-450 dark:text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/10 p-2 rounded-lg text-center">Not available</p>
                  )}
                </div>

                {/* Weather Forecast */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Weather Forecast</span>
                  {context.weather ? (
                    <div className="grid grid-cols-2 gap-2 bg-zinc-50/50 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
                      <div>Temp: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.weather.temperature}°C</span></div>
                      <div>Humidity: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.weather.humidity}%</span></div>
                      <div>Rain Prob: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.weather.rain_probability}%</span></div>
                      <div>Wind: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.weather.wind_speed} m/s</span></div>
                      <div className="col-span-2">Condition: <span className="font-semibold text-zinc-800 dark:text-zinc-300">{context.weather.weather_condition}</span></div>
                    </div>
                  ) : (
                    <p className="text-zinc-450 dark:text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/10 p-2 rounded-lg text-center">Not available</p>
                  )}
                </div>

                {/* Disease Check History */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Disease Signals</span>
                  {context.diseases.length > 0 ? (
                    <div className="space-y-1.5">
                      {context.diseases.map((d, i) => (
                        <div key={i} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{d.disease_name}</p>
                            <p className="text-[10px] text-zinc-400">Severity: {d.severity || "N/A"}</p>
                          </div>
                          <span className="font-medium text-green-600">{d.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-450 dark:text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/10 p-2 rounded-lg text-center">No disease signals</p>
                  )}
                </div>

                {/* Active Alerts */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Unread Farm Alerts</span>
                  {context.alerts.length > 0 ? (
                    <div className="space-y-1.5">
                      {context.alerts.map((a, i) => (
                        <div key={i} className="p-2 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
                          <p className="font-bold text-red-800 dark:text-red-400">{a.title}</p>
                          <p className="text-[10px] text-red-600 dark:text-red-500 truncate">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-455 dark:text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/10 p-2 rounded-lg text-center">No active alerts</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 py-4">
                Please select a farm.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis Results */}
        <div className="space-y-6 lg:col-span-2">
          {loadingRecs ? (
            <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-805 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px] space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
              <h3 className="text-base font-bold text-zinc-700 dark:text-white">Analyzing farm conditions...</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
                Re-evaluating weather warnings, crop diseases, soil nutrient reports, and irrigation records using Gemini 2.5 Flash.
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between ${getStatusStyles(analysis.overall_status)}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">System Status</span>
                  <span className="text-lg font-bold capitalize mt-2">{analysis.overall_status.replace("_", " ")}</span>
                </div>

                <div className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between ${getPriorityStyles(analysis.overall_priority)}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Overall Priority</span>
                  <span className="text-lg font-bold capitalize mt-2">{analysis.overall_priority}</span>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AI Confidence</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white mt-2">{analysis.confidence}%</span>
                </div>
              </div>

              {/* Save Recommendation Action Panel */}
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Save this advice session to history logs for offline checkups.
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-300 shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Recommendations"
                  )}
                </button>
              </div>

              {saveMessage && (
                <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-3 text-xs font-semibold text-green-800 dark:text-green-400 text-center">
                  {saveMessage}
                </div>
              )}
              {saveError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400 text-center">
                  {saveError}
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">AI Advisory Summary</h4>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>

              {/* Observations and Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    Key Observations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-650 dark:text-zinc-450 list-disc pl-4 leading-relaxed">
                    {analysis.key_observations.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    Critical Risk Factors
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-650 dark:text-zinc-455 list-disc pl-4 leading-relaxed">
                    {analysis.risk_factors.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Special Tip Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-5 shadow-2xs space-y-2">
                  <h5 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    💧 Irrigation & Water Saving Tip
                  </h5>
                  <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed font-medium">
                    {analysis.water_saving_tip}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20 p-5 shadow-2xs space-y-2">
                  <h5 className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                    🌱 Fertilizer & Soil Amendment Tip
                  </h5>
                  <p className="text-xs text-green-900 dark:text-green-300 leading-relaxed font-medium">
                    {analysis.fertilizer_tip}
                  </p>
                </div>
              </div>

              {/* Individual recommendation list */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Detailed Advisories</h4>
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label={rec.type}>
                          {getTypeIcon(rec.type)}
                        </span>
                        <div>
                          <h5 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                            {rec.title}
                          </h5>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                            {rec.type} Recommendation
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityStyles(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-550">
                          {rec.confidence}% confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                      {rec.description}
                    </p>

                    {rec.actions.length > 0 && (
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl p-3.5 space-y-2">
                        <h6 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">Recommended Action Checklist</h6>
                        <ul className="space-y-1.5">
                          {rec.actions.map((act, actIdx) => (
                            <li key={actIdx} className="flex items-start gap-2.5 text-xs text-zinc-650 dark:text-zinc-400 font-medium">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-zinc-300 text-green-600 focus:ring-green-550"
                              />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-600 mb-2">No AI advisory loaded yet.</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 max-w-xs leading-relaxed">
                Click "Generate AI Recommendations" to compute localized reports for your soil context and forecasts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs mt-8">
        <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Recommendation History</h3>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-500">Up to 20 recently logged advisory reports</p>
          </div>
          {loadingHistory && (
            <span className="text-xs text-zinc-400 animate-pulse">Reloading logs...</span>
          )}
        </div>

        {historyError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-800 dark:text-red-400 text-center mb-4">
            {historyError}
          </div>
        )}

        {loadingHistory && history.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-550 animate-pulse">
            Loading recommendation history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-1">No recommendations saved yet.</h4>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-550 max-w-xs leading-relaxed">
              Generated recommendations can be saved for future reference. Click "Save Recommendations" after running analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/10 space-y-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-150/40 dark:border-zinc-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(rec.type)}</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        {rec.title}
                      </h4>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                        {rec.type} · Saved via {rec.source || "System"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.25 rounded-md border uppercase ${getPriorityStyles(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    {rec.confidence !== null && (
                      <span className="text-[9px] text-zinc-400 font-medium">
                        {rec.confidence}% conf.
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed whitespace-pre-wrap">
                  {rec.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[9px] text-zinc-400 dark:text-zinc-550 font-semibold pt-1">
                  <span>
                    🕒 Saved: {mounted ? new Date(rec.created_at).toLocaleString() : "..."}
                  </span>
                  {rec.expires_at && (
                    <span className="text-amber-600 dark:text-amber-500">
                      ⌛ Expires: {mounted ? new Date(rec.expires_at).toLocaleString() : "..."}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advisory Disclaimer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          AI-generated recommendations are for informational purposes only. Actual farming decisions should consider local conditions and professional agricultural advice.
        </p>
      </div>
    </div>
  );
}
