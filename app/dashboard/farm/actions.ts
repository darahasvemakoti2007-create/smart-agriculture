"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_AREA_UNITS = ["acres", "hectares"];
const VALID_SOIL_TYPES = [
  "Loamy",
  "Sandy",
  "Clay",
  "Silt",
  "Black Soil",
  "Red Soil",
  "Other",
];
const VALID_IRRIGATION_TYPES = [
  "Drip",
  "Sprinkler",
  "Flood",
  "Rainfed",
  "Other",
];

export async function createFarm(formData: FormData) {
  const farmName = (formData.get("farm_name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;
  const areaRaw = formData.get("area") as string;
  const areaUnit = (formData.get("area_unit") as string)?.toLowerCase() || "acres";
  const soilType = (formData.get("soil_type") as string)?.trim() || null;
  const irrigationType = (formData.get("irrigation_type") as string)?.trim() || null;

  // --- Server-side Validations ---
  if (!farmName || farmName.length === 0) {
    return { error: "Farm name is required." };
  }

  if (farmName.length > 100) {
    return { error: "Farm name must be 100 characters or less." };
  }

  let area: number | null = null;
  if (areaRaw && areaRaw.trim().length > 0) {
    const parsedArea = parseFloat(areaRaw);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      return { error: "Area must be a valid number greater than zero." };
    }
    area = parsedArea;
  }

  if (!VALID_AREA_UNITS.includes(areaUnit)) {
    return { error: "Invalid area unit selected." };
  }

  if (soilType && !VALID_SOIL_TYPES.includes(soilType)) {
    return { error: "Invalid soil type selected." };
  }

  if (irrigationType && !VALID_IRRIGATION_TYPES.includes(irrigationType)) {
    return { error: "Invalid irrigation type selected." };
  }

  // --- Validate Coordinates ---
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  
  let latitude: number | null = null;
  let longitude: number | null = null;
  
  if (latRaw && lngRaw) {
    const parsedLat = parseFloat(latRaw);
    const parsedLng = parseFloat(lngRaw);
    
    if (!isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90) {
      latitude = parsedLat;
    } else {
      return { error: "Invalid latitude provided." };
    }
    
    if (!isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180) {
      longitude = parsedLng;
    } else {
      return { error: "Invalid longitude provided." };
    }
  }

  // --- Authentication Check ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a farm." };
  }

  // --- Insert into Database ---
  const { error } = await supabase.from("farms").insert({
    user_id: user.id,
    farm_name: farmName,
    location,
    latitude,
    longitude,
    area,
    area_unit: areaUnit,
    soil_type: soilType,
    irrigation_type: irrigationType,
  });

  if (error) {
    return { error: "Unable to save your farm. Please try again." };
  }

  // Revalidate relevant routes
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/farm");

  return { success: true };
}

export async function updateFarm(farmId: string, formData: FormData) {
  if (!farmId) {
    return { error: "Farm ID is required." };
  }

  const farmName = (formData.get("farm_name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;
  const areaRaw = formData.get("area") as string;
  const areaUnit = (formData.get("area_unit") as string)?.toLowerCase() || "acres";
  const soilType = (formData.get("soil_type") as string)?.trim() || null;
  const irrigationType = (formData.get("irrigation_type") as string)?.trim() || null;

  if (!farmName || farmName.length === 0) {
    return { error: "Farm name is required." };
  }

  if (farmName.length > 100) {
    return { error: "Farm name must be 100 characters or less." };
  }

  let area: number | null = null;
  if (areaRaw && areaRaw.trim().length > 0) {
    const parsedArea = parseFloat(areaRaw);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      return { error: "Area must be a valid number greater than zero." };
    }
    area = parsedArea;
  }

  if (!VALID_AREA_UNITS.includes(areaUnit)) {
    return { error: "Invalid area unit selected." };
  }

  if (soilType && !VALID_SOIL_TYPES.includes(soilType)) {
    return { error: "Invalid soil type selected." };
  }

  if (irrigationType && !VALID_IRRIGATION_TYPES.includes(irrigationType)) {
    return { error: "Invalid irrigation type selected." };
  }

  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  
  let latitude: number | null = null;
  let longitude: number | null = null;
  
  if (latRaw && lngRaw) {
    const parsedLat = parseFloat(latRaw);
    const parsedLng = parseFloat(lngRaw);
    if (!isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90) latitude = parsedLat;
    if (!isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180) longitude = parsedLng;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to edit a farm." };
  }

  const { error } = await supabase
    .from("farms")
    .update({
      farm_name: farmName,
      location,
      latitude,
      longitude,
      area,
      area_unit: areaUnit,
      soil_type: soilType,
      irrigation_type: irrigationType,
    })
    .eq("id", farmId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating farm:", error.message);
    return { error: "Unable to update your farm. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/farm");

  return { success: true };
}

export async function deleteFarm(farmId: string) {
  if (!farmId) {
    return { error: "Farm ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete a farm." };
  }

  const { error } = await supabase
    .from("farms")
    .delete()
    .eq("id", farmId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting farm:", error.message);
    return { error: "Unable to delete farm. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/farm");

  return { success: true };
}
