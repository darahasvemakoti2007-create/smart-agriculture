"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["active", "harvested", "planned"];

export async function createCrop(formData: FormData) {
  const farmId = (formData.get("farm_id") as string)?.trim();
  const cropName = (formData.get("crop_name") as string)?.trim();
  const variety = (formData.get("variety") as string)?.trim() || null;
  const plantingDate = (formData.get("planting_date") as string)?.trim() || null;
  const expectedHarvestDate =
    (formData.get("expected_harvest_date") as string)?.trim() || null;
  const status = (formData.get("status") as string)?.toLowerCase() || "active";

  // --- Input Validations ---
  if (!farmId || farmId.length === 0) {
    return { error: "Please select a valid farm for this crop." };
  }

  // UUID format check
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier format." };
  }

  if (!cropName || cropName.length === 0) {
    return { error: "Crop name is required." };
  }

  if (cropName.length > 100) {
    return { error: "Crop name must be 100 characters or less." };
  }

  if (variety && variety.length > 100) {
    return { error: "Variety must be 100 characters or less." };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: "Invalid crop status selected." };
  }

  // Date chronological validation
  if (plantingDate && expectedHarvestDate) {
    const pDate = new Date(plantingDate);
    const hDate = new Date(expectedHarvestDate);
    if (isNaN(pDate.getTime()) || isNaN(hDate.getTime())) {
      return { error: "One or more dates are invalid." };
    }
    if (hDate < pDate) {
      return { error: "Expected harvest date cannot be earlier than planting date." };
    }
  }

  // --- Authenticate User ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to add a crop." };
  }

  // --- Server-side Farm Ownership Verification ---
  // Ensure the selected farm belongs to the authenticated user before inserting
  const { data: farm, error: farmCheckError } = await supabase
    .from("farms")
    .select("id")
    .eq("id", farmId)
    .eq("user_id", user.id)
    .single();

  if (farmCheckError || !farm) {
    return { error: "Unauthorized: Selected farm does not belong to your account." };
  }

  // --- Insert into Database ---
  const { error: insertError } = await supabase.from("crops").insert({
    farm_id: farmId,
    user_id: user.id,
    crop_name: cropName,
    variety,
    planting_date: plantingDate,
    expected_harvest_date: expectedHarvestDate,
    status,
  });

  if (insertError) {
    return { error: "Unable to save your crop. Please try again." };
  }

  // Revalidate relevant routes
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/crops");
  revalidatePath("/dashboard/farm");

  return { success: true };
}
