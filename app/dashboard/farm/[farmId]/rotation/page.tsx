import { createClient } from "@/src/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import { getCropRotationContext } from "./actions";
import CropRotationAdvisor from "@/components/dashboard/CropRotationAdvisor";

interface CropRotationPageProps {
  params: Promise<{
    farmId: string;
  }>;
}

export default async function CropRotationPage({ params }: CropRotationPageProps) {
  const { farmId } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify farm ownership server-side & gather context
  const contextRes = await getCropRotationContext(farmId);
  if (contextRes.error || !contextRes.data) {
    redirect("/dashboard/farm");
  }

  const farm = contextRes.data.farm;
  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumb & Navigation */}
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
            <Link href="/dashboard/farm" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              My Farm
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200">{farm.farm_name}</span>
            <span>/</span>
            <span className="text-green-600 dark:text-green-400 font-bold">Crop Rotation</span>
          </div>

          {/* Header Area */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Crop Rotation & Soil Recovery Advisor
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">
              Analyze historical planting schedules and NPK values on <strong>{farm.farm_name}</strong> to optimize future rotation sequences.
            </p>
          </div>

          {/* Rotation Advisor Client Panel Workspace */}
          <CropRotationAdvisor farmId={farmId} initialContext={contextRes.data} />
        </main>
      </div>
    </div>
  );
}
