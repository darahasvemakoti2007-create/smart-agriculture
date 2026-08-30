"use client";

import { useState, useEffect } from "react";
import {
  generateCropRotationAdvisory,
  saveCropRotationAdvisory,
  getCropRotationAdvisoryHistory,
  CropRotationContext,
} from "@/app/dashboard/farm/[farmId]/rotation/actions";

interface CropRotationAdvisorProps {
  farmId: string;
  initialContext: CropRotationContext;
}

interface RotationAdvisoryResult {
  overall_status: "healthy" | "attention_required" | "soil_recovery_needed" | "insufficient_data";
  overall_priority: "low" | "medium" | "high" | "critical";
  summary: string;
  soil_assessment: {
    nitrogen_status: string;
    phosphorus_status: string;
    potassium_status: string;
    ph_status: string;
    observations: string[];
  };
  rotation_plan: Array<{
    crop_name: string;
    reason: string;
    soil_benefit: string;
    nitrogen_effect: "fixing" | "neutral" | "depleting" | "unknown";
    priority: "low" | "medium" | "high";
  }>;
  recovery_actions: string[];
  crops_to_avoid_temporarily: string[];
  sustainability_tips: string[];
  confidence: number;
}

export default function CropRotationAdvisor({
  farmId,
  initialContext,
}: CropRotationAdvisorProps) {
  const { farm, crops, soilReadings } = initialContext;

  const [generating, setGenerating] = useState<boolean>(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<RotationAdvisoryResult | null>(null);

  // Saving states
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // History states
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const loadingMessages = [
    "Reviewing crop history...",
    "Analyzing soil nutrient trends...",
    "Evaluating rotation compatibility...",
    "Preparing sustainable crop plan...",
  ];

  // Loading text rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  // Load history logs on mount & farmId changes
  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await getCropRotationAdvisoryHistory(farmId);
      if (res.error) {
        setHistoryError(res.error);
      } else if (res.data) {
        setHistory(res.data);
      }
    } catch {
      setHistoryError("Unable to load advisor history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [farmId]);

  const handleCalculateRotation = async () => {
    setGenerating(true);
    setError(null);
    setAdvisory(null);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await generateCropRotationAdvisory(farmId);
      if (!res.success) {
        setError(res.error || "Unable to generate crop rotation advice right now. Please try again.");
      } else if (res.data) {
        setAdvisory(res.data as RotationAdvisoryResult);
      }
    } catch (err) {
      setError("Unable to generate crop rotation advice right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveRotationPlan = async () => {
    if (!advisory) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await saveCropRotationAdvisory(farmId, advisory);
      if (!res.success) {
        setSaveError(res.message);
      } else {
        setSaveMessage(res.message);
        // Refresh dynamic history immediately without page reload
        loadHistory();
      }
    } catch {
      setSaveError("Unable to save rotation plan right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getOverallStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "attention_required":
        return "bg-amber-50 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case "soil_recovery_needed":
        return "bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      case "insufficient_data":
      default:
        return "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 border-red-205/40";
      case "high":
        return "bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400 border-orange-200/40";
      case "medium":
        return "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-200/40";
      case "low":
      default:
        return "bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border-blue-200/40";
    }
  };

  const getNutrientStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (["low", "acidic"].includes(s)) return "text-red-600 dark:text-red-450 bg-red-50 dark:bg-red-955/20 border-red-200";
    if (["adequate", "optimal"].includes(s)) return "text-green-600 dark:text-green-455 bg-green-50 dark:bg-green-955/20 border-green-200";
    if (["high", "alkaline"].includes(s)) return "text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 border-amber-200";
    return "text-zinc-550 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-200";
  };

  const getNitrogenEffectStyles = (effect: string) => {
    switch (effect.toLowerCase()) {
      case "fixing":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/40";
      case "neutral":
        return "bg-blue-50 dark:bg-blue-955/30 text-blue-700 dark:text-blue-400 border-blue-200/40";
      case "depleting":
        return "bg-orange-50 dark:bg-orange-955/30 text-orange-700 dark:text-orange-400 border-orange-200/40";
      case "unknown":
      default:
        return "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-450 border-zinc-200/40";
    }
  };

  const getCropStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return "bg-green-100 text-green-755 dark:bg-green-955/35 dark:text-green-400";
    if (s === "harvested") return "bg-blue-100 text-blue-755 dark:bg-blue-955/35 dark:text-blue-400";
    if (s === "failed") return "bg-red-100 text-red-755 dark:bg-red-955/35 dark:text-red-400";
    return "bg-zinc-100 text-zinc-705 dark:bg-zinc-900 dark:text-zinc-400";
  };

  const formatVal = (val: any, unit: string = "") => {
    return val !== null && val !== undefined ? `${val}${unit}` : "Not available";
  };

  const toggleHistoryExpand = (id: string) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Farm metadata context row */}
      <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-wrap gap-6 items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Active Workspace</span>
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">🏡 {farm.farm_name}</h2>
          {farm.location && <p className="text-xs text-zinc-500 dark:text-zinc-400">📍 {farm.location}</p>}
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-8 text-xs text-zinc-550 dark:text-zinc-400">
          <div>
            <span className="font-semibold text-zinc-400 block">Total Area</span>
            <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{formatVal(farm.area, " acres")}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 block">Soil Type</span>
            <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block capitalize">{farm.soil_type || "Unknown"}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 block">Crops History</span>
            <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{crops.length} logs</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 block">Soil logs</span>
            <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{soilReadings.length} logs</span>
          </div>
        </div>

        <button
          onClick={handleCalculateRotation}
          disabled={generating || saving}
          className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-655 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </>
          ) : (
            "🌱 Calculate Next Crop Rotation"
          )}
        </button>
      </div>

      {/* Main advisory layouts */}
      {generating ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <h4 className="text-base font-bold text-zinc-700 dark:text-white animate-pulse">
            {loadingMessages[loadingTextIndex]}
          </h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 max-w-xs leading-relaxed animate-pulse">
            Gemini is evaluating your crop variety rotation logs and soil NPK recovery curves...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/20 p-4 text-xs font-semibold text-red-850 dark:text-red-400 text-center animate-shake">
          {error}
        </div>
      ) : advisory ? (
        <div className="space-y-6">
          {/* Status Header */}
          <div className={`border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${getOverallStatusStyles(advisory.overall_status)}`}>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold block">Rotation Advisory Status</span>
              <h4 className="text-base font-black uppercase mt-1 leading-tight tracking-wide">
                {advisory.overall_status.replace(/_/g, " ")}
              </h4>
            </div>

            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold block uppercase opacity-80">Priority</span>
                <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityStyles(advisory.overall_priority)}`}>
                  {advisory.overall_priority}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold block uppercase opacity-80">Confidence</span>
                <span className="text-base font-black">{advisory.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Insufficient data case */}
          {advisory.overall_status === "insufficient_data" ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-xs space-y-3">
              <span className="text-3xl">📋</span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Additional Data Required</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {advisory.summary}
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Advisory Summary</span>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                  {advisory.summary}
                </p>
              </div>

              {/* NPK/pH Assessment cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nitrogen */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block border-b border-zinc-100 dark:border-zinc-900 pb-1.5"> Nitrogen (N)</span>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.soil_assessment.nitrogen_status)}`}>
                    {advisory.soil_assessment.nitrogen_status}
                  </span>
                </div>

                {/* Phosphorus */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block border-b border-zinc-100 dark:border-zinc-900 pb-1.5"> Phosphorus (P)</span>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.soil_assessment.phosphorus_status)}`}>
                    {advisory.soil_assessment.phosphorus_status}
                  </span>
                </div>

                {/* Potassium */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block border-b border-zinc-100 dark:border-zinc-900 pb-1.5"> Potassium (K)</span>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.soil_assessment.potassium_status)}`}>
                    {advisory.soil_assessment.potassium_status}
                  </span>
                </div>

                {/* pH */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block border-b border-zinc-100 dark:border-zinc-900 pb-1.5"> Soil pH</span>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.soil_assessment.ph_status)}`}>
                    {advisory.soil_assessment.ph_status}
                  </span>
                </div>
              </div>

              {/* Soil Observations */}
              {advisory.soil_assessment.observations.length > 0 && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                  <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">NPK & Soil Chemistry Observations</span>
                  <ul className="list-disc pl-4 text-xs text-zinc-655 dark:text-zinc-400 space-y-1 leading-relaxed">
                    {advisory.soil_assessment.observations.map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended crops */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Recommended Rotation Crops</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisory.rotation_plan.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                          <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">🌱 {item.crop_name}</h5>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded-md border ${getNitrogenEffectStyles(item.nitrogen_effect)}`}>
                            Nitrogen: {item.nitrogen_effect}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-555 dark:text-zinc-400"><span className="font-bold text-zinc-700 dark:text-zinc-300">Soil Benefit:</span> {item.soil_benefit}</p>
                        <p className="text-[11px] text-zinc-555 dark:text-zinc-400"><span className="font-bold text-zinc-700 dark:text-zinc-300">Reason:</span> {item.reason}</p>
                      </div>
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-450 font-bold flex justify-between items-center">
                        <span>Advisory Priority</span>
                        <span className={`uppercase px-2 py-0.5 rounded-full border text-[8px] ${getPriorityStyles(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crops to Avoid */}
              {advisory.crops_to_avoid_temporarily.length > 0 && (
                <div className="rounded-2xl border border-red-250 dark:border-red-955/20 bg-red-50 dark:bg-red-955/20 p-5 shadow-xs space-y-2">
                  <span className="text-[10px] text-red-700 dark:text-red-400 uppercase block font-bold tracking-wider">⚠️ Crops to Avoid Temporarily</span>
                  <ul className="list-disc pl-4 text-xs text-red-855 dark:text-red-400 space-y-1">
                    {advisory.crops_to_avoid_temporarily.map((item, idx) => (
                      <li key={idx} className="font-semibold">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recovery Actions Checklist */}
              {advisory.recovery_actions.length > 0 && (
                <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <span className="text-[10px] text-zinc-455 uppercase block font-bold tracking-wider">Recommended Soil Recovery Actions</span>
                  <ul className="space-y-2">
                    {advisory.recovery_actions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-650 dark:text-zinc-450 font-semibold leading-relaxed">
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

              {/* Sustainability Tips */}
              {advisory.sustainability_tips.length > 0 && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Farming Sustainability Tips</span>
                  <ul className="list-disc pl-4 text-xs text-zinc-655 dark:text-zinc-400 space-y-1.5 leading-relaxed">
                    {advisory.sustainability_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save Prescription Action Cards Section */}
              <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Save Advisor Log</h4>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500">Record this Crop Rotation plan to your farm history list.</p>
                </div>
                <button
                  onClick={handleSaveRotationPlan}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-655 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving rotation plan...
                    </>
                  ) : (
                    "Save Rotation Plan"
                  )}
                </button>
              </div>

              {saveMessage && (
                <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-3 text-xs font-semibold text-green-800 dark:text-green-400 text-center animate-fade-in">
                  {saveMessage}
                </div>
              )}
              {saveError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400 text-center animate-shake">
                  {saveError}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
          <span className="text-4xl mb-4" aria-hidden="true">🌱</span>
          <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-650 mb-2">No rotation program calculated.</h3>
          <p className="text-xs text-zinc-455 dark:text-zinc-550 max-w-sm leading-relaxed text-center">
            Select your farm context and calculate a rotation plan to receive sustainable crop recommendations.
          </p>
        </div>
      )}

      {/* Rotation Plan History List Section */}
      <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs mt-8">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Rotation Plan History</h3>
        <p className="text-[11px] text-zinc-450 dark:text-zinc-550 border-b border-zinc-100 dark:border-zinc-850 pb-3 mb-4">
          Past logged Crop Rotation & Soil Recovery plans saved for this farm
        </p>

        {loadingHistory && history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-550 animate-pulse">
            Loading advisory history...
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-205 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-800 dark:text-red-400 text-center">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-550 italic">
            No rotation history logged yet. Saved plans will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const isExpanded = expandedHistoryId === item.id;
              const adv = item.advisory;
              const hasPlan = adv && adv.rotation_plan;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        📋 {item.title}
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                        🕒 Saved {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded-md border ${getPriorityStyles(item.priority)}`}>
                        Priority: {item.priority}
                      </span>
                      {item.confidence && (
                        <span className="text-[9px] text-zinc-450 dark:text-zinc-400 font-bold">
                          {item.confidence}% confidence
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                    {adv?.summary || item.advisory?.summary || "No summary recorded."}
                  </p>

                  {isExpanded && hasPlan && (
                    <div className="pt-3 border-t border-dashed border-zinc-150 dark:border-zinc-900 space-y-4 animate-fade-in">
                      {/* Soil status sub-row */}
                      {adv.soil_assessment && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-800">
                            <span className="font-bold text-zinc-850 dark:text-zinc-300 block">Nitrogen</span>
                            <span className="capitalize">{adv.soil_assessment.nitrogen_status}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-800">
                            <span className="font-bold text-zinc-850 dark:text-zinc-300 block">Phosphorus</span>
                            <span className="capitalize">{adv.soil_assessment.phosphorus_status}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-800">
                            <span className="font-bold text-zinc-850 dark:text-zinc-300 block">Potassium</span>
                            <span className="capitalize">{adv.soil_assessment.potassium_status}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-800">
                            <span className="font-bold text-zinc-850 dark:text-zinc-300 block">pH Level</span>
                            <span className="capitalize">{adv.soil_assessment.ph_status}</span>
                          </div>
                        </div>
                      )}

                      {/* Recommended Rotation Plan */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-zinc-450 uppercase block font-bold tracking-wider">Prescribed Rotation Sequence</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          {adv.rotation_plan.map((pl: any, idxIdx: number) => (
                            <div key={idxIdx} className="p-2.5 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-950/20 rounded-lg space-y-1">
                              <span className="font-bold text-zinc-900 dark:text-white block">🌱 {pl.crop_name}</span>
                              <p className="text-zinc-500 dark:text-zinc-400"><span className="font-semibold text-zinc-700 dark:text-zinc-300">Benefit:</span> {pl.soil_benefit}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recovery Actions */}
                      {adv.recovery_actions && adv.recovery_actions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-450 uppercase block font-bold tracking-wider">Recovery Measures</span>
                          <ul className="list-disc pl-4 text-[10px] text-zinc-555 dark:text-zinc-400 space-y-0.5">
                            {adv.recovery_actions.map((actItem: string, aIdx: number) => (
                              <li key={aIdx}>{actItem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => toggleHistoryExpand(item.id)}
                      className="text-[10px] font-semibold text-green-600 hover:text-green-755 dark:text-green-500 dark:hover:text-green-450 cursor-pointer"
                    >
                      {isExpanded ? "Collapse Details ▲" : "View Full Plan ▼"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Context summaries for crop history and soil history */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Crop history logs list */}
        <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-3">
            Cultivation History Logs ({crops.length})
          </h3>
          {crops.length === 0 ? (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 italic py-4">No previous plantings recorded on this farm.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {crops.map((c) => (
                <div key={c.id} className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div>
                    <h5 className="font-bold text-zinc-805 dark:text-zinc-300">🌿 {c.crop_name} {c.variety ? `(${c.variety})` : ""}</h5>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-0.5">Planted: {formatVal(c.planting_date)}</p>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${getCropStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Soil readings history logs list */}
        <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-3">
            Recent Soil Telemetry ({soilReadings.length})
          </h3>
          {soilReadings.length === 0 ? (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 italic py-4">No soil logs recorded on this farm.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {soilReadings.map((s) => (
                <div key={s.id} className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-zinc-455 font-bold border-b border-zinc-100 dark:border-zinc-900 pb-1">
                    <span>📅 {new Date(s.recorded_at).toLocaleDateString()}</span>
                    <span>pH: {formatVal(s.ph)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <p>N: <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatVal(s.nitrogen)}</span></p>
                    <p>P: <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatVal(s.phosphorus)}</span></p>
                    <p>K: <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatVal(s.potassium)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advisory Disclaimer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-[10px] text-zinc-405 dark:text-zinc-550 max-w-2xl mx-auto leading-relaxed">
          AI-generated rotation recommendations are for informational planning purposes only. Actual cultivation schedules should consult local soil services and professional guidelines.
        </p>
      </div>
    </div>
  );
}
