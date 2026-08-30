"use client";

import { useState } from "react";
import Link from "next/link";
import CropCard, { Crop } from "@/components/dashboard/CropCard";
import CropForm from "@/components/dashboard/CropForm";
import { Farm } from "@/components/dashboard/FarmCard";

interface CropManagerProps {
  crops: Crop[];
  farms: Farm[];
}

export default function CropManager({ crops, farms }: CropManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<string>("all");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 5000);
  }

  // Filter crops by farm if multi-farm filter selected
  const filteredCrops =
    selectedFarmFilter === "all"
      ? crops
      : crops.filter((crop) => crop.farm_id === selectedFarmFilter);

  return (
    <div className="space-y-8">
      {/* Top Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            My Crops
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage the crops growing across your farms and monitor growth cycles.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <span>+</span>
            <span>Add Crop</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 flex items-center justify-between text-sm text-green-800 dark:text-green-300">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌱</span>
            <span>Crop registered successfully! Ready for AI diagnosis and monitoring.</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-green-700 dark:text-green-400 hover:text-green-900 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Crop Creation Form */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <CropForm
            farms={farms}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filter by Farm (if multiple farms exist) */}
      {farms.length > 1 && crops.length > 0 && !showForm && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setSelectedFarmFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedFarmFilter === "all"
                ? "bg-green-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            All Farms ({crops.length})
          </button>
          {farms.map((farm) => {
            const count = crops.filter((c) => c.farm_id === farm.id).length;
            return (
              <button
                key={farm.id}
                onClick={() => setSelectedFarmFilter(farm.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedFarmFilter === farm.id
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {farm.farm_name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Crops Grid or Empty State */}
      {crops.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Registered Plantings ({filteredCrops.length})
            </h2>
          </div>
          {filteredCrops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCrops.map((crop) => (
                <CropCard key={crop.id} crop={crop} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              No crops found for this farm.
            </div>
          )}
        </div>
      ) : (
        !showForm && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 p-10 sm:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-3xl flex items-center justify-center mb-4">
              🌿
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              No crops added yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
              Add your first crop to start receiving crop-specific insights, growth stage advisories, and AI recommendations.
            </p>

            {farms.length > 0 ? (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <span>+</span>
                <span>Add Your First Crop</span>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ You must create a farm property before planting crops.
                </span>
                <Link
                  href="/dashboard/farm"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm"
                >
                  <span>+</span>
                  <span>Create Your First Farm</span>
                </Link>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
