"use client";

import { useState } from "react";
import Link from "next/link";
import EditFarmModal from "@/components/dashboard/EditFarmModal";

export interface Farm {
  id: string;
  farm_name: string;
  location: string | null;
  area: number | null;
  area_unit: string | null;
  soil_type: string | null;
  irrigation_type: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface FarmCardProps {
  farm: Farm;
}

export default function FarmCard({ farm }: FarmCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs hover:shadow-md hover:border-green-300 dark:hover:border-green-900/50 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center text-2xl shrink-0">
                🏡
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  {farm.farm_name}
                </h3>
                {farm.location ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                    <span>📍</span>
                    <span>{farm.location}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-0.5">
                    No location specified
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Edit Farm Details"
              >
                <span>✏️</span>
                <span>Edit</span>
              </button>

              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50">
                Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-zinc-100 dark:border-zinc-900 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block">Total Area</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                {farm.area
                  ? `${farm.area} ${farm.area_unit || "acres"}`
                  : "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block">Soil Type</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                {farm.soil_type || "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block">Irrigation</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                {farm.irrigation_type || "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block">GPS Location</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block flex items-center gap-1">
                {farm.latitude && farm.longitude ? (
                  <>
                    <span className="text-green-600 dark:text-green-400 text-[10px]">●</span>
                    Available
                  </>
                ) : (
                  "Not specified"
                )}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block">Registered</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                {new Date(farm.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-y-2 text-xs gap-2">
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/dashboard/farm/${farm.id}/health`}
              className="inline-flex items-center gap-1 font-semibold text-green-600 dark:text-green-450 hover:text-green-755 dark:hover:text-green-300 transition-colors"
            >
              <span>🏥 Farm Health Index</span>
            </Link>
            <span className="text-zinc-200 dark:text-zinc-800" aria-hidden="true">|</span>
            <Link
              href={`/dashboard/farm/${farm.id}/rotation`}
              className="inline-flex items-center gap-1 font-semibold text-zinc-550 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span>🌱 Plan Crop Rotation</span>
            </Link>
          </div>
          <Link
            href="/dashboard/crops"
            className="inline-flex items-center gap-1 font-semibold text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>View Crops</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {isEditing && (
        <EditFarmModal farm={farm} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
}
