"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface AdvisorFarm {
  id: string;
  farm_name: string;
  area: number | null;
  soil_type: string | null;
}

export interface AdvisorCrop {
  id: string;
  crop_name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: string;
  farm_id: string;
}

export interface AdvisorSoilReading {
  id: string;
  farm_id: string;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
  recorded_at: string;
}

export interface FertilizerAdvisorContext {
  farm: AdvisorFarm;
  crop: AdvisorCrop;
  soil: AdvisorSoilReading;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch farms belonging to the authenticated user
 */
export async function getAdvisorFarms(): Promise<{ data?: AdvisorFarm[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data, error } = await supabase
      .from("farms")
      .select("id, farm_name, area, soil_type")
      .eq("user_id", user.id)
      .order("farm_name", { ascending: true });

    if (error) {
      console.error("Error fetching advisor farms:", error.message);
      return { error: "Unable to load farms list." };
    }

    const mappedFarms: AdvisorFarm[] = (data || []).map((f) => ({
      id: f.id,
      farm_name: f.farm_name,
      area: f.area ? Number(f.area) : null,
      soil_type: f.soil_type,
    }));

    return { data: mappedFarms };
  } catch (err) {
    console.error("Unexpected error fetching advisor farms:", err);
    return { error: "Unable to load farms list." };
  }
}

/**
 * Fetch crops belonging to the user and selected farm
 */
export async function getAdvisorCrops(farmId: string): Promise<{ data?: AdvisorCrop[]; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // Verify farm ownership
    const { data: farm, error: farmCheckError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmCheckError || !farm) {
      return { error: "Farm not found or access denied." };
    }

    const { data: crops, error: cropsError } = await supabase
      .from("crops")
      .select("id, crop_name, variety, planting_date, expected_harvest_date, status, farm_id")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("planting_date", { ascending: false });

    if (cropsError) {
      console.error("Error loading advisor crops:", cropsError.message);
      return { error: "Unable to load crops list." };
    }

    const mappedCrops: AdvisorCrop[] = (crops || []).map((c) => ({
      id: c.id,
      crop_name: c.crop_name,
      variety: c.variety,
      planting_date: c.planting_date,
      expected_harvest_date: c.expected_harvest_date,
      status: c.status || "active",
      farm_id: c.farm_id,
    }));

    return { data: mappedCrops };
  } catch (err) {
    console.error("Unexpected error loading crops list:", err);
    return { error: "Unable to load crops list." };
  }
}

/**
 * Fetch up to 20 latest soil readings for the selected farm
 */
export async function getAdvisorSoilReadings(farmId: string): Promise<{ data?: AdvisorSoilReading[]; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // Verify farm ownership
    const { data: farm, error: farmCheckError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmCheckError || !farm) {
      return { error: "Farm not found or access denied." };
    }

    const { data: readings, error: readingsError } = await supabase
      .from("soil_readings")
      .select("id, farm_id, nitrogen, phosphorus, potassium, ph, moisture, temperature, organic_carbon, recorded_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(20);

    if (readingsError) {
      console.error("Error loading advisor soil readings:", readingsError.message);
      return { error: "Unable to load soil readings." };
    }

    const mappedReadings: AdvisorSoilReading[] = (readings || []).map((r) => ({
      id: r.id,
      farm_id: r.farm_id,
      nitrogen: r.nitrogen ? Number(r.nitrogen) : null,
      phosphorus: r.phosphorus ? Number(r.phosphorus) : null,
      potassium: r.potassium ? Number(r.potassium) : null,
      ph: r.ph ? Number(r.ph) : null,
      moisture: r.moisture ? Number(r.moisture) : null,
      temperature: r.temperature ? Number(r.temperature) : null,
      organic_carbon: r.organic_carbon ? Number(r.organic_carbon) : null,
      recorded_at: r.recorded_at,
    }));

    return { data: mappedReadings };
  } catch (err) {
    console.error("Unexpected error loading soil readings:", err);
    return { error: "Unable to load soil readings." };
  }
}

/**
 * Fetch full verified context for the selected advisory parameters
 */
export async function getFertilizerAdvisorContext(
  farmId: string,
  cropId: string,
  soilReadingId: string
): Promise<{ data?: FertilizerAdvisorContext; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (!cropId || !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }
  if (!soilReadingId || !uuidRegex.test(soilReadingId)) {
    return { error: "Invalid soil reading identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // 1. Verify Farm Ownership
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id, farm_name, area, soil_type")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmError || !farm) {
      return { error: "Farm not found or access denied." };
    }

    // 2. Verify Crop Ownership and linkage to farm
    const { data: crop, error: cropError } = await supabase
      .from("crops")
      .select("id, crop_name, variety, planting_date, expected_harvest_date, status, farm_id")
      .eq("id", cropId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !crop) {
      return { error: "Crop context check failed or unauthorized." };
    }

    // 3. Verify Soil Reading Ownership and linkage to farm
    const { data: soil, error: soilError } = await supabase
      .from("soil_readings")
      .select("id, farm_id, nitrogen, phosphorus, potassium, ph, moisture, temperature, organic_carbon, recorded_at")
      .eq("id", soilReadingId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (soilError || !soil) {
      return { error: "Soil reading context check failed or unauthorized." };
    }

    return {
      data: {
        farm: {
          id: farm.id,
          farm_name: farm.farm_name,
          area: farm.area ? Number(farm.area) : null,
          soil_type: farm.soil_type,
        },
        crop: {
          id: crop.id,
          crop_name: crop.crop_name,
          variety: crop.variety,
          planting_date: crop.planting_date,
          expected_harvest_date: crop.expected_harvest_date,
          status: crop.status || "active",
          farm_id: crop.farm_id,
        },
        soil: {
          id: soil.id,
          farm_id: soil.farm_id,
          nitrogen: soil.nitrogen ? Number(soil.nitrogen) : null,
          phosphorus: soil.phosphorus ? Number(soil.phosphorus) : null,
          potassium: soil.potassium ? Number(soil.potassium) : null,
          ph: soil.ph ? Number(soil.ph) : null,
          moisture: soil.moisture ? Number(soil.moisture) : null,
          temperature: soil.temperature ? Number(soil.temperature) : null,
          organic_carbon: soil.organic_carbon ? Number(soil.organic_carbon) : null,
          recorded_at: soil.recorded_at,
        },
      },
    };
  } catch (err) {
    console.error("Unexpected error gathering fertilizer context:", err);
    return { error: "Unable to retrieve context verification data." };
  }
}

/**
 * Generate a validated fertilizer prescription using Gemini
 */
export async function generateFertilizerAdvisory(
  farmId: string,
  cropId: string,
  soilReadingId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const contextRes = await getFertilizerAdvisorContext(farmId, cropId, soilReadingId);
    if (contextRes.error || !contextRes.data) {
      return { success: false, error: contextRes.error || "Unable to verify context data." };
    }

    const { generateFertilizerPrescription } = await import("@/src/lib/ai/fertilizer-prescription");
    const prescription = await generateFertilizerPrescription(contextRes.data);

    return {
      success: true,
      data: prescription,
    };
  } catch (err: any) {
    console.error("Error in generateFertilizerAdvisory server action:", err);
    return {
      success: false,
      error: err.message || "Unable to generate fertilizer advice right now. Please try again.",
    };
  }
}

/**
 * Save fertilizer prescription as a recommendation entry
 */
export async function saveFertilizerAdvisory(
  farmId: string,
  cropId: string,
  prescription: any
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { success: false, error: "Invalid farm identifier." };
  }
  if (!cropId || !uuidRegex.test(cropId)) {
    return { success: false, error: "Invalid crop identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // Verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("farm_name")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmError || !farm) {
      return { success: false, error: "Farm context check failed or unauthorized." };
    }

    // Verify crop ownership
    const { data: crop, error: cropError } = await supabase
      .from("crops")
      .select("crop_name")
      .eq("id", cropId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !crop) {
      return { success: false, error: "Crop context check failed or unauthorized." };
    }

    // Duplicate save prevention (1-hour window)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing, error: existError } = await supabase
      .from("recommendations")
      .select("id")
      .eq("user_id", user.id)
      .eq("farm_id", farmId)
      .eq("crop_id", cropId)
      .eq("type", "soil")
      .gt("created_at", oneHourAgo)
      .limit(1);

    if (existError) {
      console.error("Error looking up existing recommendations:", existError.message);
    }

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: "A similar advisory was recently saved. Please wait before saving again.",
      };
    }

    // Format title and serialize complete prescription
    const title = `Fertilizer Advisory: ${crop.crop_name}`;
    const description = JSON.stringify(prescription);
    const validPriorities = ["low", "medium", "high", "critical"];
    const priority = validPriorities.includes(prescription.overall_priority?.toLowerCase())
      ? prescription.overall_priority.toLowerCase()
      : "medium";

    const { error: insertError } = await supabase.from("recommendations").insert({
      user_id: user.id,
      farm_id: farmId,
      crop_id: cropId,
      type: "soil",
      title,
      description,
      priority,
      source: "gemini-3.6-flash",
      confidence: typeof prescription.confidence === "number" ? prescription.confidence : null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      console.error("Error inserting fertilizer advisory recommendation:", insertError.message);
      return { success: false, error: "Unable to save this prescription right now." };
    }

    // Revalidate path
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/soil/advisory");
    revalidatePath("/dashboard/recommendations");

    return {
      success: true,
      message: "Prescription saved successfully.",
    };
  } catch (err) {
    console.error("Unexpected error saving fertilizer advisory:", err);
    return { success: false, error: "Unable to save this prescription right now." };
  }
}

/**
 * Fetch past logged fertilizer advisory prescriptions for a farm
 */
export async function getFertilizerAdvisoryHistory(
  farmId: string
): Promise<{ data?: any[]; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // Verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmError || !farm) {
      return { error: "Farm not found or access denied." };
    }

    const { data, error } = await supabase
      .from("recommendations")
      .select("id, farm_id, crop_id, title, description, priority, source, confidence, created_at, crops(crop_name)")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .eq("type", "soil")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading advisor history:", error.message);
      return { error: "Unable to load advisor history." };
    }

    const mappedHistory = (data || []).map((item: any) => {
      const cropObj = Array.isArray(item.crops) ? item.crops[0] : item.crops;
      let parsedAdvisory = null;
      try {
        parsedAdvisory = JSON.parse(item.description);
      } catch {
        // Fallback for non-JSON or older entries
        parsedAdvisory = { summary: item.description };
      }

      return {
        id: item.id,
        farm_id: item.farm_id,
        crop_id: item.crop_id,
        crop_name: cropObj?.crop_name || "Unknown Crop",
        title: item.title,
        priority: item.priority,
        source: item.source,
        confidence: item.confidence,
        created_at: item.created_at,
        advisory: parsedAdvisory,
      };
    });

    return { data: mappedHistory };
  } catch (err) {
    console.error("Unexpected error loading advisor history:", err);
    return { error: "Unable to load advisor history." };
  }
}
