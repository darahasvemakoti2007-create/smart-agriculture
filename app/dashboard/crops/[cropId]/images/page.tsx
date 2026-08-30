import { createClient } from "@/src/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import CropImageUploader from "@/components/dashboard/CropImageUploader";
import CropImageGallery, { CropImageItem } from "@/components/dashboard/CropImageGallery";

interface CropImagesPageProps {
  params: Promise<{
    cropId: string;
  }>;
}

export default async function CropImagesPage({ params }: CropImagesPageProps) {
  const { cropId } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!cropId || !uuidRegex.test(cropId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authentication check
  if (!user) {
    redirect("/login");
  }

  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "Farmer";
  const userEmail = user.email || "";

  // Verify crop ownership and retrieve farm metadata
  const { data: cropData, error: cropError } = await supabase
    .from("crops")
    .select("id, crop_name, variety, status, farm_id")
    .eq("id", cropId)
    .eq("user_id", user.id)
    .single();

  if (cropError || !cropData) {
    notFound();
  }

  // Fetch associated farm name
  const { data: farmData } = await supabase
    .from("farms")
    .select("farm_name, location")
    .eq("id", cropData.farm_id)
    .single();

  const farmName = farmData?.farm_name || "Assigned Farm";

  // Fetch existing crop images for this crop
  const { data: imagesData, error: imagesError } = await supabase
    .from("crop_images")
    .select("id, crop_id, cloudinary_public_id, image_url, image_type, uploaded_at")
    .eq("crop_id", cropId)
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (imagesError) {
    console.error("Error fetching crop images:", imagesError.message);
  }

  const images: CropImageItem[] = (imagesData || []).map((img) => ({
    id: img.id,
    crop_id: img.crop_id,
    cloudinary_public_id: img.cloudinary_public_id,
    image_url: img.image_url,
    image_type: img.image_type,
    uploaded_at: img.uploaded_at,
  }));

  // Fetch disease analyses for this crop's images
  const { data: analysesData, error: analysesError } = await supabase
    .from("disease_analyses")
    .select("*")
    .eq("crop_id", cropId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (analysesError) {
    console.error("Error fetching disease analyses:", analysesError.message);
  }


  return (
    <div className="dashboard-shell">
      {/* Navigation Sidebar */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Main Content View */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Breadcrumb Header */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/crops" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              My Crops
            </Link>
            <span>/</span>
            <span className="text-zinc-900 dark:text-white font-semibold">
              {cropData.crop_name} Imagery
            </span>
          </nav>

          {/* Crop Profile Summary Banner */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center text-3xl shrink-0">
                🌿
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
                    {cropData.crop_name}
                  </h1>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                    {cropData.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>🏡 {farmName}</span>
                  {cropData.variety && <span>• Variety: {cropData.variety}</span>}
                  <span>• {images.length} Image{images.length === 1 ? "" : "s"} Stored</span>
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/crops"
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 self-start sm:self-auto transition-colors"
            >
              ← Back to Crops
            </Link>
          </div>

          {/* Image Uploader Component */}
          <CropImageUploader
            cropId={cropId}
            cropName={cropData.crop_name}
          />

          {/* Image Gallery Component */}
          <CropImageGallery
            cropId={cropId}
            images={images}
            analyses={analysesData || []}
          />
        </main>
      </div>
    </div>
  );
}
