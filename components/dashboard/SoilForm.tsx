"use client";

import { useState, useEffect } from "react";
import { Farm } from "@/components/dashboard/FarmCard";
import { createSoilReading, getSoilHistory, SoilReadingRecord } from "@/app/dashboard/soil/actions";
import Link from "next/link";
import SoilHistory from "./SoilHistory";

interface SoilFormProps {
  farms: Farm[];
}

export default function SoilForm({ farms }: SoilFormProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || "");
  const [ph, setPh] = useState<string>("");
  const [nitrogen, setNitrogen] = useState<string>("");
  const [phosphorus, setPhosphorus] = useState<string>("");
  const [potassium, setPotassium] = useState<string>("");
  const [moisture, setMoisture] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [organicCarbon, setOrganicCarbon] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<SoilReadingRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async (farmId: string) => {
    if (!farmId) return;
    setHistoryLoading(true);
    try {
      const res = await getSoilHistory(farmId);
      if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load soil history:", err);
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
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No farms added yet.</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">You need to register a farm before logging soil health data.</p>
        <Link
          href="/dashboard/farm"
          className="px-6 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors inline-flex items-center"
        >
          Add Your Farm
        </Link>
      </div>
    );
  }

  const validateField = (name: string, value: string, min?: number, max?: number): string | null => {
    if (value === "") return null;
    const num = Number(value);
    if (isNaN(num)) {
      return "Must be a valid number.";
    }
    if (min !== undefined && num < min) {
      return `Must be at least ${min}.`;
    }
    if (max !== undefined && num > max) {
      return `Must be at most ${max}.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    const newErrors: Record<string, string> = {};

    const phErr = validateField("pH", ph, 0, 14);
    if (phErr) newErrors.ph = phErr;

    const nitrogenErr = validateField("Nitrogen", nitrogen, 0);
    if (nitrogenErr) newErrors.nitrogen = nitrogenErr;

    const phosphorusErr = validateField("Phosphorus", phosphorus, 0);
    if (phosphorusErr) newErrors.phosphorus = phosphorusErr;

    const potassiumErr = validateField("Potassium", potassium, 0);
    if (potassiumErr) newErrors.potassium = potassiumErr;

    const moistureErr = validateField("Moisture", moisture, 0, 100);
    if (moistureErr) newErrors.moisture = moistureErr;

    const tempErr = validateField("Temperature", temperature);
    if (tempErr) newErrors.temperature = tempErr;

    const carbonErr = validateField("Organic Carbon", organicCarbon, 0, 100);
    if (carbonErr) newErrors.organicCarbon = carbonErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const result = await createSoilReading({
        farmId: selectedFarmId,
        ph,
        nitrogen,
        phosphorus,
        potassium,
        moisture,
        temperature,
        organicCarbon,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage("Soil reading saved successfully.");
        // Reset form inputs (excluding farm select)
        setPh("");
        setNitrogen("");
        setPhosphorus("");
        setPotassium("");
        setMoisture("");
        setTemperature("");
        setOrganicCarbon("");
        
        // Refresh history automatically
        await fetchHistory(selectedFarmId);
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred while saving the soil reading.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Manual Soil Reading</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enter values from your soil testing kit. You can provide only the measurements you have.
          </p>
        </div>

        {/* Farm Selector */}
        <div>
          <label htmlFor="farm-select" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Select Farm
          </label>
          <select
            id="farm-select"
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farm_name} {farm.location ? `(${farm.location})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* pH */}
          <div>
            <label htmlFor="ph" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              pH Level (pH)
            </label>
            <input
              id="ph"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 6.5"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.ph ? "ph-error" : undefined}
            />
            {errors.ph && <p id="ph-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.ph}</p>}
          </div>

          {/* Moisture */}
          <div>
            <label htmlFor="moisture" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Moisture (%)
            </label>
            <input
              id="moisture"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 45"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.moisture ? "moisture-error" : undefined}
            />
            {errors.moisture && <p id="moisture-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.moisture}</p>}
          </div>

          {/* Nitrogen */}
          <div>
            <label htmlFor="nitrogen" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nitrogen (mg/kg)
            </label>
            <input
              id="nitrogen"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 50"
              value={nitrogen}
              onChange={(e) => setNitrogen(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.nitrogen ? "nitrogen-error" : undefined}
            />
            {errors.nitrogen && <p id="nitrogen-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nitrogen}</p>}
          </div>

          {/* Phosphorus */}
          <div>
            <label htmlFor="phosphorus" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Phosphorus (mg/kg)
            </label>
            <input
              id="phosphorus"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 30"
              value={phosphorus}
              onChange={(e) => setPhosphorus(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.phosphorus ? "phosphorus-error" : undefined}
            />
            {errors.phosphorus && <p id="phosphorus-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phosphorus}</p>}
          </div>

          {/* Potassium */}
          <div>
            <label htmlFor="potassium" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Potassium (mg/kg)
            </label>
            <input
              id="potassium"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 200"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.potassium ? "potassium-error" : undefined}
            />
            {errors.potassium && <p id="potassium-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.potassium}</p>}
          </div>

          {/* Temperature */}
          <div>
            <label htmlFor="temperature" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Temperature (°C)
            </label>
            <input
              id="temperature"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 24"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.temperature ? "temperature-error" : undefined}
            />
            {errors.temperature && <p id="temperature-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.temperature}</p>}
          </div>

          {/* Organic Carbon */}
          <div>
            <label htmlFor="organicCarbon" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Organic Carbon (%)
            </label>
            <input
              id="organicCarbon"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 1.8"
              value={organicCarbon}
              onChange={(e) => setOrganicCarbon(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              aria-describedby={errors.organicCarbon ? "organicCarbon-error" : undefined}
            />
            {errors.organicCarbon && <p id="organicCarbon-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.organicCarbon}</p>}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex flex-col items-start gap-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Soil Reading"
            )}
          </button>

          {successMessage && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-4 text-sm font-medium text-green-800 dark:text-green-400 w-full text-center">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm font-medium text-red-800 dark:text-red-400 w-full text-center">
              {errorMessage}
            </div>
          )}
        </div>
      </form>

      {/* Soil History & Latest Reading section */}
      <div className="mt-8 max-w-4xl">
        {historyLoading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
          </div>
        ) : (
          <SoilHistory history={history} />
        )}
      </div>
    </div>
  );
}
