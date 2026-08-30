import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import FarmManager from "@/components/dashboard/FarmManager";
import { Farm } from "@/components/dashboard/FarmCard";

export default async function FarmPage() {
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

  // Query farms belonging to the authenticated user (enforced by RLS)
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
          <FarmManager farms={farms} />
        </main>
      </div>
    </div>
  );
}

