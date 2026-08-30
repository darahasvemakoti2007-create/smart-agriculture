"use client";

import { useState } from "react";
import { Farm } from "@/components/dashboard/FarmCard";
import { updateFarm, deleteFarm } from "@/app/dashboard/farm/actions";

interface EditFarmModalProps {
  farm: Farm;
  onClose: () => void;
}

export default function EditFarmModal({ farm, onClose }: EditFarmModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(farm.latitude);
  const [longitude, setLongitude] = useState<number | null>(farm.longitude);
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
        setLocationError("Unable to retrieve location. Please check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await updateFarm(farm.id, formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        setLoading(false);
        onClose();
      }
    } catch {
      setError("An unexpected error occurred while updating your farm.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const result = await deleteFarm(farm.id);
      if (result?.error) {
        setError(result.error);
        setDeleting(false);
      } else {
        setDeleting(false);
        onClose();
      }
    } catch {
      setError("An error occurred while deleting farm.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏡</span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Edit Farm Details
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Update information for "{farm.farm_name}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {showConfirmDelete ? (
          <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-center space-y-4">
            <span className="text-3xl block">⚠️</span>
            <h3 className="text-base font-bold text-white">Delete "{farm.farm_name}"?</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              This action cannot be undone. All linked soil readings, crops, and telemetry history for this farm will be deleted.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {deleting ? "Deleting..." : "Yes, Delete Farm"}
              </button>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-5">
            {/* Farm Name */}
            <div>
              <label
                htmlFor="edit_farm_name"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Farm Name <span className="text-green-600">*</span>
              </label>
              <input
                id="edit_farm_name"
                name="farm_name"
                type="text"
                required
                defaultValue={farm.farm_name}
                disabled={loading}
                placeholder="e.g. Green Valley Farm"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Location & GPS */}
            <div>
              <label
                htmlFor="edit_location"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Location / Region
              </label>
              <div className="flex gap-2">
                <input
                  id="edit_location"
                  name="location"
                  type="text"
                  defaultValue={farm.location || ""}
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
                  {isLocating ? "Locating..." : "📍 Update Location"}
                </button>
              </div>

              {locationError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{locationError}</p>
              )}

              {latitude !== null && longitude !== null && !locationError && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  ✓ Location: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}

              {latitude !== null && <input type="hidden" name="latitude" value={latitude} />}
              {longitude !== null && <input type="hidden" name="longitude" value={longitude} />}
            </div>

            {/* Area & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit_area"
                  className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Total Area
                </label>
                <input
                  id="edit_area"
                  name="area"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={farm.area || ""}
                  disabled={loading}
                  placeholder="e.g. 5.5"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit_area_unit"
                  className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Area Unit
                </label>
                <select
                  id="edit_area_unit"
                  name="area_unit"
                  defaultValue={farm.area_unit || "acres"}
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
                  htmlFor="edit_soil_type"
                  className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Primary Soil Type
                </label>
                <select
                  id="edit_soil_type"
                  name="soil_type"
                  defaultValue={farm.soil_type || ""}
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
                  htmlFor="edit_irrigation_type"
                  className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Irrigation Method
                </label>
                <select
                  id="edit_irrigation_type"
                  name="irrigation_type"
                  defaultValue={farm.irrigation_type || ""}
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

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🗑 Delete Farm</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
