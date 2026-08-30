import { createClient } from "@/src/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import { getFarmHealthContext } from "./actions";

interface FarmHealthPageProps {
  params: Promise<{
    farmId: string;
  }>;
}

export default async function FarmHealthPage({ params }: FarmHealthPageProps) {
  const { farmId } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify farm ownership server-side and gather context
  const contextRes = await getFarmHealthContext(farmId);
  if (!contextRes.success || !contextRes.data) {
    redirect("/dashboard/farm");
  }

  const { farm, crops, soilReadings, weatherRecords, alerts, diseaseAnalyses, recommendations } = contextRes.data;

  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
            <Link href="/dashboard/farm" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              My Farm
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200">{farm.farm_name}</span>
            <span>/</span>
            <span className="text-green-600 dark:text-green-400 font-bold">Health Index</span>
          </div>

          {/* Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Farm Health & Risk Index
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
                A unified view of your farm's soil, weather, crop and disease health.
              </p>
            </div>

            <button
              disabled
              className="px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 font-semibold text-sm cursor-not-allowed border border-zinc-200 dark:border-zinc-800 transition-colors self-start sm:self-auto"
            >
              Analyze Farm Health Index
            </button>
          </div>

          {/* Farm context metadata panel */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-wrap gap-6 items-center">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Property Detail</span>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">🏡 {farm.farm_name}</h2>
              {farm.location && <p className="text-xs text-zinc-500 dark:text-zinc-400">📍 {farm.location}</p>}
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-8 text-xs text-zinc-550 dark:text-zinc-400 ml-auto">
              <div>
                <span className="font-semibold text-zinc-450 block">Area</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                  {farm.area ? `${farm.area} acres` : "Not specified"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-455 block">Soil Classification</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block capitalize">
                  {farm.soil_type || "Unknown"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-400 block">Crops Context</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                  {crops.length} registered
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-400 block">Soil Context</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                  {soilReadings.length} logs
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-400 block">Alerts Context</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                  {alerts.length} active
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-400 block">Disease Context</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                  {diseaseAnalyses.length} runs
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Placeholder Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side: Health Gauge and recommendations */}
            <div className="md:col-span-1 space-y-6">
              {/* Health Score */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs text-center space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-left border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  Overall Farm Health
                </h3>
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <span className="text-4xl text-zinc-300 animate-pulse">📊</span>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                    Health analysis will appear here
                  </p>
                </div>
              </div>

              {/* Action plan */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  Recommended Actions
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  AI-generated actions will appear here
                </p>
              </div>
            </div>

            {/* Right side: Detailed parameters assessment */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Soil Health */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    Soil Health
                  </h3>
                  <p className="text-xs text-zinc-405 dark:text-zinc-500 italic">
                    NPK and soil health analysis
                  </p>
                </div>

                {/* Weather Risk */}
                <div className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    Weather Risk
                  </h3>
                  <p className="text-xs text-zinc-405 dark:text-zinc-500 italic">
                    Weather risk analysis
                  </p>
                </div>

                {/* Crop Health */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    Crop Health
                  </h3>
                  <p className="text-xs text-zinc-405 dark:text-zinc-500 italic">
                    Crop condition analysis
                  </p>
                </div>

                {/* Disease Risk */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    Disease Risk
                  </h3>
                  <p className="text-xs text-zinc-405 dark:text-zinc-500 italic">
                    Disease risk analysis
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 max-w-2xl mx-auto leading-relaxed">
              Consolidated health ratings are calculated for general planning guidance. Real farm decisions should consult professional soil surveys and regional meteorological advices.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
