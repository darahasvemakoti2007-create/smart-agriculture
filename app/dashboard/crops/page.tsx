import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import CropManager from "@/components/dashboard/CropManager";
import { Crop } from "@/components/dashboard/CropCard";
import { Farm } from "@/components/dashboard/FarmCard";

export default async function CropsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side authentication check
  if (!user) {
    redirect("/login");
  }

  // Extract user details
  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  // Query farms belonging to this user (for farm select & crop card labels)
  const { data: farmsData } = await supabase
    .from("farms")
    .select("id, farm_name, location, latitude, longitude, area, area_unit, soil_type, irrigation_type, created_at")
    .order("created_at", { ascending: false });

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

  // Create farm lookup map for fast farm_name retrieval
  const farmMap = new Map<string, string>();
  farms.forEach((f) => farmMap.set(f.id, f.farm_name));

  // Query crops belonging to this user
  const { data: cropsData, error: cropsError } = await supabase
    .from("crops")
    .select("id, farm_id, crop_name, variety, planting_date, expected_harvest_date, status, created_at")
    .order("created_at", { ascending: false });

  if (cropsError) {
    console.error("Error fetching crops:", cropsError.message);
  }

  const crops: Crop[] = (cropsData || []).map((c) => ({
    id: c.id,
    farm_id: c.farm_id,
    crop_name: c.crop_name,
    variety: c.variety,
    planting_date: c.planting_date,
    expected_harvest_date: c.expected_harvest_date,
    status: c.status,
    created_at: c.created_at,
    farm_name: farmMap.get(c.farm_id) || "Assigned Farm",
  }));

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <CropManager crops={crops} farms={farms} />
        </main>
      </div>
    </div>
  );
}

