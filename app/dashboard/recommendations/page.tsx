import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import RecommendationsList from "@/components/dashboard/RecommendationsList";

export default async function RecommendationsPage() {
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

  // Fetch user's registered farms
  const { data: farmsData, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (farmsError) {
    console.error("Error fetching farms for recommendations page:", farmsError.message);
  }

  // Fetch active crops belonging only to user's farms
  const { data: cropsData, error: cropsError } = await supabase
    .from("crops")
    .select("id, farm_id, crop_name, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (cropsError) {
    console.error("Error fetching crops for recommendations page:", cropsError.message);
  }

  const farms = farmsData || [];
  const crops = cropsData || [];

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              AI Recommendations
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
              Generate agricultural advice tailored to your weather forecast, crop selection, and soil telemetry.
            </p>
          </div>

          {farms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-4xl mb-4">🏡</div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">No registered farms found</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 max-w-xs leading-relaxed mb-6">
                You need at least one registered farm to generate AI recommendations and telemetry analysis.
              </p>
              <a
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-650 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Register a Farm
              </a>
            </div>
          ) : (
            <RecommendationsList farms={farms} crops={crops} />
          )}
        </main>
      </div>
    </div>
  );
}

