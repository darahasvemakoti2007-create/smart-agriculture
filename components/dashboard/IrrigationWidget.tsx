"use client";

import { useState, useEffect } from "react";
import { Farm } from "@/components/dashboard/FarmCard";
import { Crop } from "@/components/dashboard/CropCard";
import { getIrrigationContext, IrrigationContext, logIrrigationRecord, getIrrigationHistory, IrrigationHistoryRecord } from "@/app/dashboard/irrigation/actions";
import { analyzeIrrigationNeed } from "@/app/dashboard/irrigation/ai-actions";
import { IrrigationAnalysisResult } from "@/src/lib/ai/irrigation-analysis";
import Link from "next/link";
import IrrigationHistory from "./IrrigationHistory";

interface IrrigationWidgetProps {
  farms: Farm[];
  crops: Crop[];
}

export default function IrrigationWidget({ farms, crops }: IrrigationWidgetProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || "");
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  
  const [context, setContext] = useState<IrrigationContext | null>(null);
  const [analysis, setAnalysis] = useState<IrrigationAnalysisResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<IrrigationHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loggingRecord, setLoggingRecord] = useState(false);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  // Filter crops belonging to selected farm, sort active/planned crops first
  useEffect(() => {
    if (!selectedFarmId) {
      setFilteredCrops([]);
      setSelectedCropId("");
      return;
    }

    const farmCrops = crops.filter((crop) => crop.farm_id === selectedFarmId);
    
    // Sort active and planned first
    const sortedCrops = [...farmCrops].sort((a, b) => {
      const priority = { active: 1, planned: 2, harvested: 3, failed: 4 };
      return (priority[a.status] || 9) - (priority[b.status] || 9);
    });

    setFilteredCrops(sortedCrops);
    setSelectedCropId(sortedCrops[0]?.id || "");
    setContext(null);
    setAnalysis(null);
    setError(null);
    setLogSuccess(null);
  }, [selectedFarmId, crops]);

  const fetchHistory = async (farmId: string) => {
    if (!farmId) return;
    setHistoryLoading(true);
    try {
      const res = await getIrrigationHistory(farmId);
      if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load irrigation history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedFarmId);
  }, [selectedFarmId]);

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🏡</div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No farms added yet.</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">You need to register a farm before calculating irrigation requirements.</p>
        <Link
          href="/dashboard/farm"
          className="px-6 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors inline-flex items-center"
        >
          Add Your Farm
        </Link>
      </div>
    );
  }

  const handleCalculate = async () => {
    if (!selectedFarmId || !selectedCropId) return;

    setCalculating(true);
    setError(null);
    setContext(null);
    setAnalysis(null);

    try {
      // 1. Fetch parameters context
      const ctxResult = await getIrrigationContext(selectedFarmId, selectedCropId);
      if (ctxResult.error || !ctxResult.data) {
        setError(ctxResult.error || "Failed to load parameters context.");
        setCalculating(false);
        return;
      }
      setContext(ctxResult.data);

      // 2. Perform AI analysis
      const aiResult = await analyzeIrrigationNeed(selectedFarmId, selectedCropId);
      if (aiResult.error) {
        setError(aiResult.error);
      } else if (aiResult.data) {
        setAnalysis(aiResult.data);
      }
    } catch (err: any) {
      setError("An unexpected error occurred while running analysis.");
    } finally {
      setCalculating(false);
    }
  };

  const handleLogRecord = async () => {
    if (!analysis || !selectedFarmId || !selectedCropId) return;

    setLoggingRecord(true);
    setError(null);
    setLogSuccess(null);

    const formattedRec = `Recommendation: ${analysis.recommendation}
Urgency: ${analysis.urgency}
Reasoning: ${analysis.reasoning}
Weather: ${analysis.weather_consideration}
Soil: ${analysis.soil_consideration}
Crop: ${analysis.crop_consideration}
Water-saving tip: ${analysis.water_saving_tip}`;

    try {
      const result = await logIrrigationRecord({
        farmId: selectedFarmId,
        cropId: selectedCropId,
        recommendation: formattedRec,
        recommendedTime: analysis.recommended_time,
        estimatedDurationMinutes: analysis.estimated_duration_minutes,
        confidence: analysis.confidence,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setLogSuccess("Irrigation recommendation logged successfully.");
        await fetchHistory(selectedFarmId);
      }
    } catch (err: any) {
      setError("An unexpected error occurred while saving the log.");
    } finally {
      setLoggingRecord(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col md:flex-row gap-6">
        {/* Farm Selector */}
        <div className="flex-1">
          <label htmlFor="farm-selector" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Select Farm
          </label>
          <select
            id="farm-selector"
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            disabled={calculating}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farm_name} {farm.location ? `(${farm.location})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Selector */}
        <div className="flex-1">
          <label htmlFor="crop-selector" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Select Crop
          </label>
          {filteredCrops.length === 0 ? (
            <div className="flex items-center justify-between h-[42px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-xs text-zinc-400 dark:text-zinc-500">
              <span>No active crops on this farm.</span>
              <Link href="/dashboard/crops" className="font-semibold text-green-600 dark:text-green-500 hover:underline">
                Add Crop
              </Link>
            </div>
          ) : (
            <select
              id="crop-selector"
              value={selectedCropId}
              onChange={(e) => {
                setSelectedCropId(e.target.value);
                setContext(null);
                setAnalysis(null);
                setError(null);
              }}
              disabled={calculating}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            >
              {filteredCrops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.crop_name} {crop.variety ? `(${crop.variety})` : ""} - {crop.status}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-end">
          <button
            onClick={handleCalculate}
            disabled={filteredCrops.length === 0 || calculating}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
          >
            {calculating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing irrigation needs...
              </>
            ) : (
              "Calculate Irrigation Needs"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm font-medium text-red-800 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Irrigation Recommendation</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Real-time advisory analysis</p>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">💧</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Status</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${analysis.irrigation_needed ? "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40" : "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/40"}`}>
                {analysis.irrigation_needed ? "Recommended" : "Not Required"}
              </span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">⚠️</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Urgency</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">{analysis.urgency}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🕒</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Best Time</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{analysis.recommended_time}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">⏱️</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Duration</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{analysis.estimated_duration_minutes} mins</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🎯</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Confidence</span>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{analysis.confidence}%</span>
            </div>
          </div>

          {/* Reasoning summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Analysis Summary</h4>
            <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* Highlight advisory card observations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
              <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">🌦️ Weather Analysis</h5>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.weather_consideration}</p>
            </div>

            <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
              <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">🧪 Soil & Moisture</h5>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.soil_consideration}</p>
            </div>

            <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4">
              <h5 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">🌿 Crop Stage</h5>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.crop_consideration}</p>
            </div>
          </div>

          {/* Water Saving Tip */}
          <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h5 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Water Saving Tip</h5>
              <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed">{analysis.water_saving_tip}</p>
            </div>
          </div>

          {/* Recommendation detailed string text */}
          <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-4 space-y-1">
            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider">Specific Recommendation</h5>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{analysis.recommendation}</p>
          </div>

          {/* Safety Disclaimer */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed italic text-center">
            AI-generated irrigation guidance is for informational purposes only. Actual irrigation decisions should consider local conditions and professional agricultural advice.
          </div>

          {/* Action to log the run */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Save this advice to your logs to track crop watering activities.
            </div>
            <button
              onClick={handleLogRecord}
              disabled={loggingRecord || !!logSuccess}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loggingRecord ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving Log...
                </>
              ) : logSuccess ? (
                "Logged Successfully ✓"
              ) : (
                "Log Irrigation Run"
              )}
            </button>
          </div>

          {logSuccess && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-3 text-xs font-semibold text-green-800 dark:text-green-400 text-center">
              {logSuccess}
            </div>
          )}
        </div>
      )}

      {context && (
        <div className="space-y-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gathered Context</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Parameters collected securely for smart irrigation analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Farm & Crop */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Farm & Crop</h4>
              
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block font-medium">Farm Name</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{context.farm.farm_name}</span>
                {context.farm.location && <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">{context.farm.location}</span>}
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block font-medium">Crop & Variety</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{context.crop.crop_name}</span>
                {context.crop.variety && <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">{context.crop.variety}</span>}
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block font-medium">Crop Age</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {context.cropAgeDays !== null ? `${context.cropAgeDays} days` : "Not available"}
                </span>
              </div>
            </div>

            {/* Weather */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Latest Weather</h4>
              {context.weather ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Temp</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.weather.temperature !== null ? `${Math.round(context.weather.temperature)}°C` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Humidity</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.weather.humidity !== null ? `${Math.round(context.weather.humidity)}%` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Rain Prob.</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.weather.rain_probability !== null ? `${context.weather.rain_probability}%` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Wind</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.weather.wind_speed !== null ? `${Math.round(context.weather.wind_speed * 3.6)} km/h` : "N/A"}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Condition</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{context.weather.weather_condition || "Unknown"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No weather records available for this farm.</p>
              )}
            </div>

            {/* Soil Readings */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Latest Soil</h4>
              {context.soil ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">pH</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.ph !== null ? context.soil.ph : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Moisture</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.moisture !== null ? `${Math.round(context.soil.moisture)}%` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Nitrogen</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.nitrogen !== null ? `${context.soil.nitrogen} mg/kg` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Phosphorus</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.phosphorus !== null ? `${context.soil.phosphorus} mg/kg` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Potassium</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.potassium !== null ? `${context.soil.potassium} mg/kg` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Carbon</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{context.soil.organic_carbon !== null ? `${context.soil.organic_carbon}%` : "N/A"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No soil readings available for this farm.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!analysis && !context && !calculating && (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[250px]">
          <div className="text-4xl mb-4 opacity-60">💧</div>
          <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-600 mb-2">AI irrigation analysis will appear here.</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-600 max-w-sm">
            Once calculated, the advice card will display custom duration, watering urgency, and detailed weather-adaptive analysis.
          </p>
        </div>
      )}

      {selectedFarmId && (
        <div className="pt-4">
          {historyLoading ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-center shadow-sm text-sm text-zinc-500">
              Loading irrigation history...
            </div>
          ) : (
            <IrrigationHistory history={history} />
          )}
        </div>
      )}
    </div>
  );
}
