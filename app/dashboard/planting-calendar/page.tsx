import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import PlantingCalendarClient from "@/components/dashboard/PlantingCalendarClient";

export default async function PlantingCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  const { data: farmsData } = await supabase
    .from("farms")
    .select("id, farm_name")
    .order("created_at", { ascending: false });

  const farms = (farmsData || []).map((f) => ({
    id: f.id,
    farm_name: f.farm_name,
  }));

  return (
    <div className="dashboard-shell">
      <Sidebar userName={userName} userEmail={userEmail} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🗓</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    AI Smart Planting Calendar
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-extrabold uppercase tracking-wider border border-green-200/30">
                    ✨ Unique AI Feature
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1">
                  Gemini AI analyzes your soil, location & weather to build a personalized 6-month crop planting plan with daily task schedules.
                </p>
              </div>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: "🌱", text: "Crop recommendations based on your soil" },
                { icon: "📅", text: "Day-by-day task schedule" },
                { icon: "🌦", text: "Weather-aware planting windows" },
                { icon: "🧪", text: "Fertilizer & spray timing" },
              ].map((chip, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                  {chip.icon} {chip.text}
                </span>
              ))}
            </div>
          </div>

          <PlantingCalendarClient farms={farms} />
        </main>
      </div>
    </div>
  );
}

