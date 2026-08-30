import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import IrrigationWidget from "@/components/dashboard/IrrigationWidget";
import { Farm } from "@/components/dashboard/FarmCard";
import { Crop } from "@/components/dashboard/CropCard";

export default async function IrrigationPage() {
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
  const { data: farmsData, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name, location, latitude, longitude, area, area_unit, soil_type, irrigation_type, created_at")
    .order("created_at", { ascending: false });

  if (farmsError) {
    console.error("Error fetching farms for irrigation page:", farmsError.message);
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

  // Fetch crops belonging only to these farms
  const { data: cropsData, error: cropsError } = await supabase
    .from("crops")
    .select("id, farm_id, crop_name, variety, planting_date, expected_harvest_date, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (cropsError) {
    console.error("Error fetching crops for irrigation page:", cropsError.message);
  }

  const crops: Crop[] = (cropsData || []).map((c) => ({
    id: c.id,
    farm_id: c.farm_id,
    crop_name: c.crop_name,
    variety: c.variety,
    planting_date: c.planting_date,
    expected_harvest_date: c.expected_harvest_date,
    status: c.status as "active" | "harvested" | "failed" | "planned",
    created_at: c.created_at,
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
              Smart Irrigation
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
              Calculate accurate crop water requirements using localized weather forecasts, soil moisture, and active crop stages.
            </p>
          </div>

          <IrrigationWidget farms={farms} crops={crops} />
        </main>
      </div>
    </div>
  );
}

