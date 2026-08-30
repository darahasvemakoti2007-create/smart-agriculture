"use client";

import { useState } from "react";
import Link from "next/link";
import { createCrop } from "@/app/dashboard/crops/actions";
import { Farm } from "@/components/dashboard/FarmCard";

interface CropFormProps {
  farms: Farm[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CropForm({ farms, onSuccess, onCancel }: CropFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If farmer has no farms, display a helper to create one first
  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-2xl flex items-center justify-center mx-auto mb-3">
          🏡
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
          No farms available
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
          You must create a farm property before adding your crops so we can associate soil and location data.
        </p>
        <div className="flex items-center justify-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          )}
          <Link
            href="/dashboard/farm"
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm"
          >
            + Add Farm First
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createCrop(formData);
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
      setError("An unexpected error occurred while saving your crop.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Add New Crop
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Register a crop planted on one of your farms
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
        {/* Farm Selection */}
        <div>
          <label
            htmlFor="farm_id"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Select Farm <span className="text-green-600">*</span>
          </label>
          <select
            id="farm_id"
            name="farm_id"
            required
            defaultValue={farms[0]?.id || ""}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farm_name} {farm.location ? `(${farm.location})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Name & Variety */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="crop_name"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Crop Name <span className="text-green-600">*</span>
            </label>
            <input
              id="crop_name"
              name="crop_name"
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Wheat, Tomato, Cotton"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="variety"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Variety / Cultivar
            </label>
            <input
              id="variety"
              name="variety"
              type="text"
              disabled={loading}
              placeholder="e.g. Sharbati, Roma F1"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Planting Date & Expected Harvest Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="planting_date"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Planting / Sowing Date
            </label>
            <input
              id="planting_date"
              name="planting_date"
              type="date"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="expected_harvest_date"
              className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Expected Harvest Date
            </label>
            <input
              id="expected_harvest_date"
              name="expected_harvest_date"
              type="date"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Growth Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
          >
            <option value="active">Active (Currently Growing)</option>
            <option value="planned">Planned (Upcoming Sowing)</option>
            <option value="harvested">Harvested (Completed Cycle)</option>
          </select>
        </div>

        {/* Form Action Buttons */}
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
                <span>Registering Crop…</span>
              </>
            ) : (
              <span>Register Crop</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
