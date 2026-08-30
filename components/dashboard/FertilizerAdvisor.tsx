"use client";

import { useState, useEffect } from "react";
import {
  getAdvisorFarms,
  getAdvisorCrops,
  getAdvisorSoilReadings,
  generateFertilizerAdvisory,
  saveFertilizerAdvisory,
  getFertilizerAdvisoryHistory,
  AdvisorFarm,
  AdvisorCrop,
  AdvisorSoilReading,
} from "@/app/dashboard/soil/advisory/actions";

interface AdvisoryResult {
  overall_status: "healthy" | "attention_required" | "critical" | "insufficient_data";
  overall_priority: "low" | "medium" | "high" | "critical";
  summary: string;
  nutrient_analysis: {
    nitrogen: { status: string; observation: string };
    phosphorus: { status: string; observation: string };
    potassium: { status: string; observation: string };
    ph: { status: string; observation: string };
  };
  fertilizer_plan: Array<{
    fertilizer_name: string;
    purpose: string;
    application_guidance: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
  organic_alternatives: string[];
  action_checklist: string[];
  cautions: string[];
  confidence: number;
}

export default function FertilizerAdvisor() {
  const [farms, setFarms] = useState<AdvisorFarm[]>([]);
  const [crops, setCrops] = useState<AdvisorCrop[]>([]);
  const [soilReadings, setSoilReadings] = useState<AdvisorSoilReading[]>([]);

  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [selectedReadingId, setSelectedReadingId] = useState<string>("");

  const [loadingFarms, setLoadingFarms] = useState<boolean>(false);
  const [loadingCropsAndSoil, setLoadingCropsAndSoil] = useState<boolean>(false);

  const [generating, setGenerating] = useState<boolean>(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);

  const [advisory, setAdvisory] = useState<AdvisoryResult | null>(null);

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
    "Analyzing soil conditions...",
    "Evaluating crop nutrient requirements...",
    "Preparing fertilizer guidance...",
  ];

  // Rotate loading text sequentially
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

  // Load farms on mount
  useEffect(() => {
    const loadFarms = async () => {
      setLoadingFarms(true);
      setError(null);
      try {
        const res = await getAdvisorFarms();
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setFarms(res.data);
        }
      } catch (err) {
        setError("Unable to load farms list. Please try again.");
      } finally {
        setLoadingFarms(false);
      }
    };
    loadFarms();
  }, []);

  // Fetch history for selected farm
  const loadHistory = async (farmId: string) => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await getFertilizerAdvisoryHistory(farmId);
      if (res.error) {
        setHistoryError(res.error);
      } else if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      setHistoryError("Unable to load advisory history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle farm selection change
  const handleFarmChange = async (farmId: string) => {
    setSelectedFarmId(farmId);
    setSelectedCropId("");
    setSelectedReadingId("");
    setCrops([]);
    setSoilReadings([]);
    setError(null);
    setAdvisory(null);
    setAdvisoryError(null);
    setSaveMessage(null);
    setSaveError(null);
    setHistory([]);

    if (!farmId) return;

    setLoadingCropsAndSoil(true);
    try {
      const [cropsRes, soilRes] = await Promise.all([
        getAdvisorCrops(farmId),
        getAdvisorSoilReadings(farmId),
      ]);

      if (cropsRes.error) {
        setError(cropsRes.error);
      } else if (cropsRes.data) {
        setCrops(cropsRes.data);
      }

      if (soilRes.error) {
        setError(soilRes.error);
      } else if (soilRes.data) {
        setSoilReadings(soilRes.data);
      }

      // Load advisory logs history
      loadHistory(farmId);
    } catch (err) {
      setError("Failed to retrieve farm crop and soil reading details. Please try again.");
    } finally {
      setLoadingCropsAndSoil(false);
    }
  };

  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    setAdvisory(null);
    setAdvisoryError(null);
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleReadingChange = (readingId: string) => {
    setSelectedReadingId(readingId);
    setAdvisory(null);
    setAdvisoryError(null);
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleGenerate = async () => {
    if (!selectedFarmId || !selectedCropId || !selectedReadingId) return;
    setGenerating(true);
    setAdvisoryError(null);
    setAdvisory(null);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await generateFertilizerAdvisory(selectedFarmId, selectedCropId, selectedReadingId);
      if (!res.success) {
        setAdvisoryError(res.error || "Unable to generate fertilizer advice right now. Please try again.");
      } else if (res.data) {
        setAdvisory(res.data as AdvisoryResult);
      }
    } catch (err) {
      setAdvisoryError("Unable to generate fertilizer advice right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!advisory || !selectedFarmId || !selectedCropId) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await saveFertilizerAdvisory(selectedFarmId, selectedCropId, advisory);
      if (!res.success) {
        setSaveError(res.error || "Unable to save this prescription right now. Please try again.");
      } else {
        setSaveMessage("Prescription saved successfully.");
        // Refresh advisory history list immediately
        loadHistory(selectedFarmId);
      }
    } catch (err) {
      setSaveError("Unable to save this prescription right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);
  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const selectedSoilReading = soilReadings.find((s) => s.id === selectedReadingId);

  const canGenerate = !!selectedFarmId && !!selectedCropId && !!selectedReadingId;

  // Status mapping functions
  const getOverallStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "attention_required":
        return "bg-amber-50 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case "critical":
        return "bg-red-50 dark:bg-red-955/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "insufficient_data":
      default:
        return "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 border-red-250/40";
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

  const toggleHistoryExpand = (id: string) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Parameter selectors grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Selection Card */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Configure Prescription Context
            </h3>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Farm Selector */}
            <div className="space-y-1">
              <label htmlFor="farm-select" className="block text-[10px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider">
                Select Farm
              </label>
              <select
                id="farm-select"
                value={selectedFarmId}
                onChange={(e) => handleFarmChange(e.target.value)}
                disabled={loadingFarms || loadingCropsAndSoil || generating || saving}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              >
                <option value="">-- Choose registered farm --</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    🏡 {f.farm_name} ({f.soil_type || "Unknown Soil"})
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Selector */}
            <div className="space-y-1">
              <label htmlFor="crop-select" className="block text-[10px] font-bold text-zinc-455 dark:text-zinc-550 uppercase tracking-wider">
                Select Crop
              </label>
              <select
                id="crop-select"
                value={selectedCropId}
                onChange={(e) => handleCropChange(e.target.value)}
                disabled={!selectedFarmId || loadingCropsAndSoil || generating || saving}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              >
                <option value="">-- Choose active crop --</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    🌿 {c.crop_name} {c.variety ? `(${c.variety})` : ""} - {c.status}
                  </option>
                ))}
              </select>
              {!loadingCropsAndSoil && selectedFarmId && crops.length === 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium block">
                  ⚠️ No active crops available.
                </span>
              )}
            </div>

            {/* Soil Reading Selector */}
            <div className="space-y-1">
              <label htmlFor="soil-select" className="block text-[10px] font-bold text-zinc-455 dark:text-zinc-550 uppercase tracking-wider">
                Select Soil Reading Log
              </label>
              <select
                id="soil-select"
                value={selectedReadingId}
                onChange={(e) => handleReadingChange(e.target.value)}
                disabled={!selectedFarmId || loadingCropsAndSoil || generating || saving}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              >
                <option value="">-- Choose soil log timestamp --</option>
                {soilReadings.map((s) => (
                  <option key={s.id} value={s.id}>
                    🪨 {new Date(s.recorded_at).toLocaleDateString()} at {new Date(s.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </option>
                ))}
              </select>
              {!loadingCropsAndSoil && selectedFarmId && soilReadings.length === 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium block">
                  ⚠️ No soil readings available.
                </span>
              )}
            </div>

            {/* Selected Context Preview Summary */}
            {selectedFarmId && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-[10px] text-zinc-450 uppercase tracking-wider">Context Preview</h4>
                <div className="space-y-1 text-zinc-650 dark:text-zinc-400 text-[11px] leading-tight">
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Farm:</span> {selectedFarm?.farm_name || "--"}</p>
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Crop:</span> {selectedCrop?.crop_name || "--"} {selectedCrop?.variety ? `(${selectedCrop.variety})` : ""}</p>
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Soil Reading:</span> {selectedSoilReading ? new Date(selectedSoilReading.recorded_at).toLocaleDateString() : "--"}</p>
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Moisture:</span> {selectedSoilReading?.moisture !== null ? `${selectedSoilReading?.moisture}%` : "--"}</p>
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Temperature:</span> {selectedSoilReading?.temperature !== null ? `${selectedSoilReading?.temperature}°C` : "--"}</p>
                  <p><span className="font-bold text-zinc-800 dark:text-zinc-250">Organic Carbon:</span> {selectedSoilReading?.organic_carbon !== null ? `${selectedSoilReading?.organic_carbon}%` : "--"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-850">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loadingCropsAndSoil || generating || saving}
              className={`w-full px-5 py-3 rounded-xl font-semibold text-sm text-center transition-all flex items-center justify-center gap-2 ${
                canGenerate && !generating && !saving
                  ? "bg-green-600 hover:bg-green-655 text-white shadow-xs cursor-pointer"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing Soil & Crop...
                </>
              ) : (
                "Generate Fertilizer Prescription"
              )}
            </button>
          </div>
        </div>

        {/* Right columns: Nutrient Meters & Prescription Advice */}
        <div className="lg:col-span-2 space-y-6">
          {/* Soil Nutrient Overview cards */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Soil Nutrient Overview (NPK)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-center space-y-1">
                <span className="text-2xl" aria-hidden="true">🧪</span>
                <span className="text-[10px] text-zinc-450 font-bold uppercase block tracking-wider">Nitrogen (N)</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white block">
                  {selectedSoilReading?.nitrogen !== null ? `${selectedSoilReading?.nitrogen} mg/kg` : "-- mg/kg"}
                </span>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-center space-y-1">
                <span className="text-2xl" aria-hidden="true">🧬</span>
                <span className="text-[10px] text-zinc-455 font-bold uppercase block tracking-wider">Phosphorus (P)</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white block">
                  {selectedSoilReading?.phosphorus !== null ? `${selectedSoilReading?.phosphorus} mg/kg` : "-- mg/kg"}
                </span>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-center space-y-1">
                <span className="text-2xl" aria-hidden="true">🔥</span>
                <span className="text-[10px] text-zinc-450 font-bold uppercase block tracking-wider">Potassium (K)</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white block">
                  {selectedSoilReading?.potassium !== null ? `${selectedSoilReading?.potassium} mg/kg` : "-- mg/kg"}
                </span>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-center space-y-1">
                <span className="text-2xl" aria-hidden="true">🍋</span>
                <span className="text-[10px] text-zinc-455 font-bold uppercase block tracking-wider">Soil pH</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white block">
                  {selectedSoilReading?.ph !== null ? `${selectedSoilReading?.ph} pH` : "-- pH"}
                </span>
              </div>
            </div>
          </div>

          {generating ? (
            <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px] space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
              <h4 className="text-base font-bold text-zinc-700 dark:text-white animate-pulse">
                {loadingMessages[loadingTextIndex]}
              </h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
                Evaluating macro-nutrients against your selected crop variety context...
              </p>
            </div>
          ) : advisoryError ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/20 p-4 text-xs font-semibold text-red-800 dark:text-red-400 text-center animate-shake">
              {advisoryError}
            </div>
          ) : advisory ? (
            /* Premium Advisory results panel */
            <div className="space-y-6">
              {/* Overall Status Card */}
              <div className={`border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${getOverallStatusStyles(advisory.overall_status)}`}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold block">Soil Chemistry Status</span>
                  <h4 className="text-base font-black uppercase mt-1 leading-tight tracking-wide">
                    {advisory.overall_status.replace("_", " ")}
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

              {/* Summary */}
              <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Prescription Summary</span>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                  {advisory.summary}
                </p>
              </div>

              {/* NPK/pH Nutrient observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nitrogen */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">🧪 Nitrogen (N)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.nutrient_analysis.nitrogen.status)}`}>
                      {advisory.nutrient_analysis.nitrogen.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                    {advisory.nutrient_analysis.nitrogen.observation}
                  </p>
                </div>

                {/* Phosphorus */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">🧬 Phosphorus (P)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.nutrient_analysis.phosphorus.status)}`}>
                      {advisory.nutrient_analysis.phosphorus.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                    {advisory.nutrient_analysis.phosphorus.observation}
                  </p>
                </div>

                {/* Potassium */}
                <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">🔥 Potassium (K)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.nutrient_analysis.potassium.status)}`}>
                      {advisory.nutrient_analysis.potassium.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                    {advisory.nutrient_analysis.potassium.observation}
                  </p>
                </div>

                {/* pH */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">🍋 Soil pH</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getNutrientStatusStyles(advisory.nutrient_analysis.ph.status)}`}>
                      {advisory.nutrient_analysis.ph.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-555 dark:text-zinc-400 leading-relaxed">
                    {advisory.nutrient_analysis.ph.observation}
                  </p>
                </div>
              </div>

              {/* Fertilizer Plan */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">NPK Dosage Treatment Prescription</span>
                {advisory.fertilizer_plan.length === 0 ? (
                  <p className="text-xs text-zinc-450 dark:text-zinc-555 italic">No fertilizer application is recommended from the available data.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advisory.fertilizer_plan.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-150/85 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 space-y-2">
                        <div className="flex justify-between items-center gap-2 border-b border-zinc-150/40 dark:border-zinc-800/40 pb-2">
                          <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">💧 {item.fertilizer_name}</h5>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded-md border ${getPriorityStyles(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400"><span className="font-bold text-zinc-700 dark:text-zinc-300">Purpose:</span> {item.purpose}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400"><span className="font-bold text-zinc-700 dark:text-zinc-300">Guidance:</span> {item.application_guidance}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Organic alternatives list */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Sustainable Organic Alternatives</span>
                {advisory.organic_alternatives.length === 0 ? (
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 italic">No specific organic alternative was identified.</p>
                ) : (
                  <ul className="list-disc pl-4 text-xs text-zinc-655 dark:text-zinc-405 space-y-1">
                    {advisory.organic_alternatives.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action checklist */}
              <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                <span className="text-[10px] text-zinc-455 uppercase block font-bold tracking-wider">NPK Treatment Checklist</span>
                {advisory.action_checklist.length === 0 ? (
                  <p className="text-xs text-zinc-405 dark:text-zinc-500 italic">No actions recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {advisory.action_checklist.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-650 dark:text-zinc-450 font-semibold leading-relaxed">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-zinc-300 text-green-600 focus:ring-green-550"
                        />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cautions */}
              {advisory.cautions.length > 0 && (
                <div className="rounded-2xl border border-amber-255 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-955/20 p-5 shadow-xs space-y-2">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase block font-bold tracking-wider">⚠️ Safety Warnings & Cautions</span>
                  <ul className="list-disc pl-4 text-xs text-amber-800 dark:text-amber-405 space-y-1 leading-relaxed">
                    {advisory.cautions.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save Prescription Action Cards Section */}
              <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Save Advisory Logs</h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500">Record this NPK prescription to your farm advisory history.</p>
                </div>
                <button
                  onClick={handleSavePrescription}
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-655 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving prescription...
                    </>
                  ) : (
                    "Save Prescription"
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
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px] h-full">
              <span className="text-4xl mb-4" aria-hidden="true">🌾</span>
              <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-650 mb-2">No nutrient prescription loaded.</h3>
              <p className="text-xs text-zinc-455 dark:text-zinc-500 max-w-sm leading-relaxed">
                Configure your farm, crop, and soil readings in the advisor panel to diagnose deficiencies and calculate precise NPK application dosages.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advisory History Section */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs mt-8">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Advisory History</h3>
        <p className="text-[11px] text-zinc-450 dark:text-zinc-550 border-b border-zinc-100 dark:border-zinc-850 pb-3 mb-4">
          Past NPK fertilizer recommendations saved for this farm
        </p>

        {loadingHistory && history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-555 animate-pulse">
            Loading advisory history...
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-205 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-800 dark:text-red-400 text-center">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-550 italic">
            No advisory logs recorded yet. Prescriptions will appear here once saved.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const isExpanded = expandedHistoryId === item.id;
              const adv = item.advisory;
              const hasAnalysis = adv && adv.nutrient_analysis;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        📋 {item.title}
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                        🌱 Crop variety: {item.crop_name} · 🕒 Saved {new Date(item.created_at).toLocaleDateString()}
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
                    {adv?.summary || item.advisory?.summary || "No summary prescription recorded."}
                  </p>

                  {isExpanded && hasAnalysis && (
                    <div className="pt-3 border-t border-dashed border-zinc-150 dark:border-zinc-900 space-y-4 animate-fade-in">
                      {/* NPK subtable */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-zinc-900 dark:text-white block">Nitrogen</span>
                          <span className="capitalize text-[10px] font-semibold">{adv.nutrient_analysis.nitrogen?.status || "unknown"}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-zinc-900 dark:text-white block">Phosphorus</span>
                          <span className="capitalize text-[10px] font-semibold">{adv.nutrient_analysis.phosphorus?.status || "unknown"}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-zinc-900 dark:text-white block">Potassium</span>
                          <span className="capitalize text-[10px] font-semibold">{adv.nutrient_analysis.potassium?.status || "unknown"}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-zinc-900 dark:text-white block">pH Level</span>
                          <span className="capitalize text-[10px] font-semibold">{adv.nutrient_analysis.ph?.status || "unknown"}</span>
                        </div>
                      </div>

                      {/* Plan guidance */}
                      {adv.fertilizer_plan && adv.fertilizer_plan.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-450 uppercase block font-bold tracking-wider">NPK Prescribed Dosages</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            {adv.fertilizer_plan.map((pl: any, idxIdx: number) => (
                              <div key={idxIdx} className="p-2 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 rounded-lg">
                                <span className="font-bold text-zinc-800 dark:text-zinc-250 block">💧 {pl.fertilizer_name}</span>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">{pl.purpose}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Organic alternatives list */}
                      {adv.organic_alternatives && adv.organic_alternatives.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-450 uppercase block font-bold tracking-wider">Organic Alternatives</span>
                          <ul className="list-disc pl-4 text-[10px] text-zinc-555 dark:text-zinc-400 space-y-0.5">
                            {adv.organic_alternatives.map((altItem: string, oIdx: number) => (
                              <li key={oIdx}>{altItem}</li>
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
                      {isExpanded ? "Collapse Details ▲" : "View Full Prescription ▼"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-center pt-2">
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          NPK advisory recommendations are strictly advisory and do not substitute professional laboratory chemical soil testing.
        </p>
      </div>
    </div>
  );
}
