"use client";

import { useState } from "react";
import { createFarm } from "@/app/dashboard/farm/actions";

interface FarmFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FarmForm({ onSuccess, onCancel }: FarmFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const captureLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError("Unable to retrieve your location. Please ensure location services are enabled.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createFarm(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch {
      setError("An unexpected error occurred while saving your farm.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Add New Farm
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Enter your agricultural property details
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm p-1"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-5">
        {/* Farm Name */}
        <div>
          <label
            htmlFor="farm_name"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Farm Name <span className="text-green-600">*</span>
          </label>
          <input
            id="farm_name"
            name="farm_name"
            type="text"
            required
            disabled={loading}
            placeholder="e.g. Green Valley Farm"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>

        {/* Location & GPS */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Location / Region
          </label>
          <div className="flex gap-2">
            <input
              id="location"
              name="location"
              type="text"
              disabled={loading}
              placeholder="e.g. Nashik, Maharashtra"
              className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={captureLocation}
              disabled={loading || isLocating}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {isLocating ? "Locating..." : "📍 Use My Location"}
            </button>
          </div>
          
          {locationError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{locationError}</p>
          )}
          
          {latitude !== null && longitude !== null && !locationError && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Location captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}

          {/* Hidden inputs to pass to server action */}
          {latitude !== null && <input type="hidden" name="latitude" value={latitude} />}
          {longitude !== null && <input type="hidden" name="longitude" value={longitude} />}
        </div>

        {/* Area & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="area"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Total Area
            </label>
            <input
              id="area"
              name="area"
              type="number"
              step="0.01"
              min="0.01"
              disabled={loading}
              placeholder="e.g. 5.5"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="area_unit"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Area Unit
            </label>
            <select
              id="area_unit"
              name="area_unit"
              defaultValue="acres"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
        </div>

        {/* Soil Type & Irrigation Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="soil_type"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Primary Soil Type
            </label>
            <select
              id="soil_type"
              name="soil_type"
              defaultValue=""
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            >
              <option value="">Select soil type (optional)</option>
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Clay">Clay</option>
              <option value="Silt">Silt</option>
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="irrigation_type"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Irrigation Method
            </label>
            <select
              id="irrigation_type"
              name="irrigation_type"
              defaultValue=""
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            >
              <option value="">Select irrigation (optional)</option>
              <option value="Drip">Drip</option>
              <option value="Sprinkler">Sprinkler</option>
              <option value="Flood">Flood</option>
              <option value="Rainfed">Rainfed</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Saving Farm…</span>
              </>
            ) : (
              <span>Save Farm</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
