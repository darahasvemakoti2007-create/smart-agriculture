import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCard from "@/components/dashboard/SummaryCard";
import FarmOverview from "@/components/dashboard/FarmOverview";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity, { ActivityItem } from "@/components/dashboard/RecentActivity";
import { Farm } from "@/components/dashboard/FarmCard";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import FarmerHelper from "@/components/dashboard/FarmerHelper";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side authentication check (defense-in-depth along with middleware)
  if (!user) {
    redirect("/login");
  }

  // Extract user details securely from authenticated session
  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  // Fetch user farms to display active status
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

  // Fetch user crops count
  const { count: cropCount } = await supabase
    .from("crops")
    .select("*", { count: "exact", head: true });

  const totalCrops = cropCount || 0;

  // Fetch user's latest soil reading moisture
  const { data: latestSoilReading } = await supabase
    .from("soil_readings")
    .select("moisture")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch total soil readings count
  const { count: soilCount } = await supabase
    .from("soil_readings")
    .select("*", { count: "exact", head: true });

  const totalSoilReadings = soilCount || 0;
  const soilMoistureValue = latestSoilReading && latestSoilReading.moisture !== null
    ? `${Math.round(latestSoilReading.moisture)}%`
    : "Not Available";

    // Fetch unread alerts count
    const { count: unreadAlertsCount } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  
    const unreadCount = unreadAlertsCount || 0;
    const badgeText = unreadCount === 0 ? "Normal" : unreadCount === 1 ? "1 Alert" : `${unreadCount} Alerts`;

    const activities: ActivityItem[] = [];

    // 1. Fetch Alerts
    try {
      const { data: alertsData } = await supabase
        .from("alerts")
        .select("id, title, message, severity, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
  
      if (alertsData) {
        alertsData.forEach((a) => {
          activities.push({
            id: a.id,
            type: "alert",
            title: a.title,
            description: a.message,
            timestamp: a.created_at,
            severity: a.severity as any,
            href: "/dashboard/alerts",
          });
        });
      }
    } catch (err) {
      console.error("Error fetching alerts for activity stream:", err);
    }
  
    // 2. Fetch Soil Readings
    try {
      const { data: soilData } = await supabase
        .from("soil_readings")
        .select("id, moisture, ph, recorded_at, farms(farm_name)")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(10);
  
      if (soilData) {
        soilData.forEach((s: any) => {
          const farmName = s.farms?.farm_name || "Unknown Farm";
          const parts = [];
          if (s.moisture !== null && s.moisture !== undefined) {
            parts.push(`Moisture: ${Math.round(s.moisture)}%`);
          }
          if (s.ph !== null && s.ph !== undefined) {
            parts.push(`pH: ${s.ph}`);
          }
          const telemetry = parts.join(" · ") || "Telemetry update logged";
          activities.push({
            id: s.id,
            type: "soil",
            title: "Soil Reading Recorded",
            description: `${telemetry} (Farm: ${farmName})`,
            timestamp: s.recorded_at,
            href: "/dashboard/soil",
          });
        });
      }
    } catch (err) {
      console.error("Error fetching soil readings for activity stream:", err);
    }
  
    // 3. Fetch Disease Analyses
    try {
      const { data: diseaseData } = await supabase
        .from("disease_analyses")
        .select("id, crop_id, disease_name, confidence, severity, created_at, crops(crop_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
  
      if (diseaseData) {
        diseaseData.forEach((d: any) => {
          const cropName = d.crops?.crop_name || "Unknown Crop";
          const disease = d.disease_name?.toLowerCase() || "";
          const isHealthy = disease === "healthy" || disease === "none" || disease === "normal";
          const desc = isHealthy
            ? `Crop "${cropName}" checked: No disease detected (Confidence: ${Math.round(d.confidence)}%)`
            : `Crop "${cropName}" checked: Possible ${d.disease_name} detected (Confidence: ${Math.round(d.confidence)}%)`;
          
          activities.push({
            id: d.id,
            type: "disease",
            title: isHealthy ? "Disease Check: Healthy" : "Crop Disease Detected",
            description: desc,
            timestamp: d.created_at,
            severity: isHealthy ? undefined : (d.severity as any || "moderate"),
            href: d.crop_id ? `/dashboard/crops/${d.crop_id}/images` : "/dashboard/crops",
          });
        });
      }
    } catch (err) {
      console.error("Error fetching disease analyses for activity stream:", err);
    }
  
    // Combine and sort by timestamp descending, limit to 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header Area */}
          <DashboardHeader userName={userName} />

          {/* Key Metric Summary Cards */}
          <DashboardMetrics
            totalCrops={totalCrops}
            hasFarms={farms.length > 0}
            soilMoistureValue={soilMoistureValue}
            totalSoilReadings={totalSoilReadings}
            unreadCount={unreadCount}
          />

          {/* Farmer's Quick-Start & Usability Guide */}
          <FarmerHelper />

          {/* Farm Overview Section */}
          <FarmOverview farms={farms} />

          {/* Quick Actions Section */}
          <QuickActions />

          {/* Recent Activity Section */}
          <RecentActivity activities={sortedActivities} />
        </main>
      </div>
    </div>
  );
}

