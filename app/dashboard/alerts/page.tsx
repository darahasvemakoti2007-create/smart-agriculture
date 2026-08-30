import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import AlertsList from "@/components/dashboard/AlertsList";
import { getAlertsList } from "@/app/dashboard/alerts/actions";

export default async function AlertsPage() {
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

  // Securely query list of alerts server-side
  const { data: alertsData, error } = await getAlertsList();
  if (error) {
    console.error("Error loading alerts page context:", error);
  }

  const alerts = alertsData || [];

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Alerts Center
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
              Monitor important conditions across your farms and crops.
            </p>
          </div>

          <AlertsList initialAlerts={alerts} />
        </main>
      </div>
    </div>
  );
}

