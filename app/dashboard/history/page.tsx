import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import HistoryCharts from "@/components/dashboard/HistoryCharts";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  // Fetch last 30 soil readings (ordered oldest → newest for chart)
  const { data: soilReadings } = await supabase
    .from("soil_readings")
    .select("nitrogen, phosphorus, potassium, moisture, ph, recorded_at")
    .order("recorded_at", { ascending: true })
    .limit(30);

  // Fetch all disease detections (for history log + chart)
  const { data: diseaseEvents } = await supabase
    .from("disease_detections")
    .select("disease_name, severity, crop_name, detected_at, confidence_score")
    .order("detected_at", { ascending: false })
    .limit(50);

  // Fetch all crops for timeline
  const { data: crops } = await supabase
    .from("crops")
    .select("id, crop_name, variety, planting_date, expected_harvest_date, status, created_at")
    .order("planting_date", { ascending: false })
    .limit(20);

  // Fetch alerts summary by month for trend
  const { data: alerts } = await supabase
    .from("alerts")
    .select("severity, created_at, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(60);

  return (
    <div className="dashboard-shell">
      <Sidebar userName={userName} userEmail={userEmail} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">📊</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Historical Analysis
              </h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
              Visual trends for soil telemetry, disease events, crop timelines, and farm alerts over time.
            </p>
          </div>

          <HistoryCharts
            soilReadings={soilReadings || []}
            diseaseEvents={diseaseEvents || []}
            crops={crops || []}
            alerts={alerts || []}
          />
        </main>
      </div>
    </div>
  );
}

