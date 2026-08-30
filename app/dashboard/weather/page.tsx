import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import { Farm } from "@/components/dashboard/FarmCard";

export default async function WeatherPage() {
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
    console.error("Error fetching farms:", error.message);
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Weather Intelligence
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
              Get hyper-local, real-time weather data for your specific farm coordinates.
            </p>
          </div>

          <WeatherWidget farms={farms} />
        </main>
      </div>
    </div>
  );
}

