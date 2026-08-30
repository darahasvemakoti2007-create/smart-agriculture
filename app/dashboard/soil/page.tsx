import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import SoilForm from "@/components/dashboard/SoilForm";
import { Farm } from "@/components/dashboard/FarmCard";

export default async function SoilPage() {
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

  // Fetch only farms belonging to the authenticated user
  const { data: farmsData, error } = await supabase
    .from("farms")
    .select("id, farm_name, location, latitude, longitude, area, area_unit, soil_type, irrigation_type, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching farms for soil page:", error.message);
  }

  const farms: Farm[] = (farmsData || []).map((f) => ({
    id: f.id,
    farm_name: f.farm_name,
    location: f.location,
    latitude: f.latitude,
    longitude: f.longitude,
    area: f.area ? Number(f.area) : null,
    area_unit: f.area_unit,
    soil_type: f.soil_type,
    irrigation_type: f.irrigation_type,
    created_at: f.created_at,
  }));

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Soil Health Management
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
                Monitor, track, and log your soil pH, NPK nutrients, moisture, and temperature readings.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/dashboard/soil/advisory"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-650 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all"
              >
                🔬 Open Fertilizer Advisor
              </Link>
            </div>
          </div>

          <SoilForm farms={farms} />
        </main>
      </div>
    </div>
  );
}

