"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface RotationFarm {
  id: string;
  farm_name: string;
  area: number | null;
  soil_type: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RotationCropHistory {
  id: string;
  crop_name: string;
  variety: string | null;
  status: string;
  planting_date: string | null;
  expected_harvest_date: string | null;
}

export interface RotationSoilHistory {
  id: string;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
  recorded_at: string;
}

export interface CropRotationContext {
  farm: RotationFarm;
  crops: RotationCropHistory[];
  soilReadings: RotationSoilHistory[];
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch farm metadata context after validating ownership
 */
export async function getRotationFarmContext(
  farmId: string
): Promise<{ data?: RotationFarm; error?: string }> {
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

    const { data: farm, error } = await supabase
      .from("farms")
      .select("id, farm_name, area, soil_type, location, latitude, longitude")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (error || !farm) {
      return { error: "Farm not found or access denied." };
    }

    return {
      data: {
        id: farm.id,
        farm_name: farm.farm_name,
        area: farm.area ? Number(farm.area) : null,
        soil_type: farm.soil_type,
        location: farm.location,
        latitude: farm.latitude ? Number(farm.latitude) : null,
        longitude: farm.longitude ? Number(farm.longitude) : null,
      },
    };
  } catch (err) {
    console.error("Unexpected error loading rotation farm context:", err);
    return { error: "Unable to retrieve farm details context." };
  }
}

/**
 * Fetch historical cultivation crop listings for the farm context
 */
export async function getRotationCropHistory(
  farmId: string
): Promise<{ data?: RotationCropHistory[]; error?: string }> {
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
      .select("id, crop_name, variety, status, planting_date, expected_harvest_date")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("planting_date", { ascending: false });

    if (cropsError) {
      console.error("Error loading rotation crop list:", cropsError.message);
      return { error: "Unable to load crop history records." };
    }

    const mappedCrops: RotationCropHistory[] = (crops || []).map((c) => ({
      id: c.id,
      crop_name: c.crop_name,
      variety: c.variety,
      status: c.status || "active",
      planting_date: c.planting_date,
      expected_harvest_date: c.expected_harvest_date,
    }));

    return { data: mappedCrops };
  } catch (err) {
    console.error("Unexpected error retrieving rotation crop history:", err);
    return { error: "Unable to load crop history records." };
  }
}

/**
 * Fetch latest 20-30 soil readings for rotation calculations context
 */
export async function getRotationSoilHistory(
  farmId: string
): Promise<{ data?: RotationSoilHistory[]; error?: string }> {
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
      .select("id, nitrogen, phosphorus, potassium, ph, moisture, temperature, organic_carbon, recorded_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);

    if (readingsError) {
      console.error("Error loading soil readings for rotation history:", readingsError.message);
      return { error: "Unable to load soil history readings." };
    }

    const mappedReadings: RotationSoilHistory[] = (readings || []).map((r) => ({
      id: r.id,
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
    console.error("Unexpected error retrieving rotation soil history:", err);
    return { error: "Unable to load soil history readings." };
  }
}

/**
 * Combined secure action gathering all necessary parameters for Crop Rotation planning
 */
export async function getCropRotationContext(
  farmId: string
): Promise<{ data?: CropRotationContext; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  try {
    // 1. Fetch Farm context
    const farmRes = await getRotationFarmContext(farmId);
    if (farmRes.error || !farmRes.data) {
      return { error: farmRes.error || "Farm check failed." };
    }

    // 2. Fetch crop history logs
    const cropsRes = await getRotationCropHistory(farmId);
    if (cropsRes.error) {
      return { error: cropsRes.error };
    }

    // 3. Fetch soil logs history
    const soilRes = await getRotationSoilHistory(farmId);
    if (soilRes.error) {
      return { error: soilRes.error };
    }

    return {
      data: {
        farm: farmRes.data,
        crops: cropsRes.data || [],
        soilReadings: soilRes.data || [],
      },
    };
  } catch (err) {
    console.error("Unexpected error gathering combined crop rotation context:", err);
    return { error: "Unable to compile advisor history context." };
  }
}

/**
 * Perform Crop Rotation analysis using Gemini server action wrapper
 */
export async function generateCropRotationAdvisory(
  farmId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const contextRes = await getCropRotationContext(farmId);
    if (contextRes.error || !contextRes.data) {
      return { success: false, error: contextRes.error || "Unable to gather farm context." };
    }

    const { generateCropRotationAnalysis } = await import("@/src/lib/ai/rotation-analysis");
    const result = await generateCropRotationAnalysis(contextRes.data);

    return { success: true, data: result };
  } catch (err: any) {
    console.error("Error generating crop rotation advisory:", err);
    return {
      success: false,
      error: err.message || "Unable to generate crop rotation advice right now. Please try again.",
    };
  }
}

/**
 * Save crop rotation advisory as a recommendation entry
 */
export async function saveCropRotationAdvisory(
  farmId: string,
  advisory: any
): Promise<{ success: boolean; duplicate: boolean; message: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { success: false, duplicate: false, message: "Invalid farm identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, duplicate: false, message: "Authentication required." };
    }

    // Verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmError || !farm) {
      return { success: false, duplicate: false, message: "Farm not found or access denied." };
    }

    const title = "Crop Rotation & Soil Recovery Plan";

    // Duplicate save prevention (1-hour window)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing, error: existError } = await supabase
      .from("recommendations")
      .select("id")
      .eq("user_id", user.id)
      .eq("farm_id", farmId)
      .eq("type", "soil")
      .eq("title", title)
      .gt("created_at", oneHourAgo)
      .limit(1);

    if (existError) {
      console.error("Error looking up existing recommendations:", existError.message);
    }

    if (existing && existing.length > 0) {
      return {
        success: false,
        duplicate: true,
        message: "This rotation recommendation was already saved recently.",
      };
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    const priority = validPriorities.includes(advisory.overall_priority?.toLowerCase())
      ? advisory.overall_priority.toLowerCase()
      : "medium";

    const { error: insertError } = await supabase.from("recommendations").insert({
      user_id: user.id,
      farm_id: farmId,
      crop_id: null,
      type: "soil",
      title,
      description: JSON.stringify(advisory),
      priority,
      source: "gemini",
      confidence: typeof advisory.confidence === "number" ? advisory.confidence : null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      console.error("Error inserting crop rotation recommendation:", insertError.message);
      return { success: false, duplicate: false, message: "Unable to save crop rotation recommendation." };
    }

    // Revalidate paths
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/dashboard/farm/${farmId}/rotation`);
    revalidatePath("/dashboard/recommendations");

    return {
      success: true,
      duplicate: false,
      message: "Rotation recommendation saved successfully.",
    };
  } catch (err) {
    console.error("Unexpected error saving crop rotation advisory:", err);
    return { success: false, duplicate: false, message: "Unable to save crop rotation recommendation." };
  }
}

/**
 * Fetch past logged crop rotation advisories for a farm
 */
export async function getCropRotationAdvisoryHistory(
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
      .select("id, title, description, priority, source, confidence, created_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .eq("type", "soil")
      .eq("title", "Crop Rotation & Soil Recovery Plan")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading rotation advisor history:", error.message);
      return { error: "Unable to load advisor history." };
    }

    const mappedHistory = (data || []).map((item: any) => {
      let parsedAdvisory = null;
      try {
        parsedAdvisory = JSON.parse(item.description);
      } catch {
        parsedAdvisory = { summary: item.description };
      }

      return {
        id: item.id,
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
    console.error("Unexpected error loading rotation history:", err);
    return { error: "Unable to load advisor history." };
  }
}
