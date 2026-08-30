"use client";

import { useState } from "react";
import FarmCard, { Farm } from "@/components/dashboard/FarmCard";
import FarmForm from "@/components/dashboard/FarmForm";

interface FarmManagerProps {
  farms: Farm[];
}

export default function FarmManager({ farms }: FarmManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 5000);
  }

  return (
    <div className="space-y-8">
      {/* Top Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            My Farm
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your registered agricultural land, soil profiles, and irrigation systems.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <span>+</span>
            <span>Add Farm</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 flex items-center justify-between text-sm text-green-800 dark:text-green-300">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">✅</span>
            <span>Farm added successfully! Your property is now configured.</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-green-700 dark:text-green-400 hover:text-green-900 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Farm Creation Form (Inline / Modal Card) */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <FarmForm
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Farms List or Empty State */}
      {farms.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Registered Properties ({farms.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        </div>
      ) : (
        !showForm && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 p-10 sm:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-3xl flex items-center justify-center mb-4">
              🏡
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              No farm added yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
              Add your farm details to start receiving personalized agricultural insights, crop disease advisories, and smart irrigation schedules.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>+</span>
              <span>Add Your Farm</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}
