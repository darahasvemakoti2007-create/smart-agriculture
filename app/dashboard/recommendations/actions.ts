"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface FarmContext {
  id: string;
  farm_name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  area_unit: string | null;
  soil_type: string | null;
  irrigation_type: string | null;
}

export interface CropContext {
  id: string;
  farm_id: string;
  crop_name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: string;
}

export interface SoilContext {
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
  recorded_at: string;
}

export interface WeatherContext {
  temperature: number | null;
  humidity: number | null;
  rain_probability: number | null;
  wind_speed: number | null;
  weather_condition: string | null;
  forecast_date: string | null;
}

export interface DiseaseContext {
  disease_name: string | null;
  confidence: number | null;
  severity: string | null;
  risk_level: string | null;
  symptoms: any;
  created_at: string;
}

export interface AlertContext {
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
}

export interface RecommendationContext {
  farm: FarmContext;
  crop: CropContext | null;
  cropAgeDays: number | null;
  soil: SoilContext | null;
  weather: WeatherContext | null;
  diseases: DiseaseContext[];
  alerts: AlertContext[];
}

export async function getRecommendationContext(
  farmId: string,
  cropId?: string
): Promise<{ data?: RecommendationContext; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (cropId && !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to retrieve recommendation context." };
  }

  // 1. Fetch & Verify Farm Ownership
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, farm_name, location, latitude, longitude, area, area_unit, soil_type, irrigation_type")
    .eq("id", farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or access denied." };
  }

  // 2. Fetch & Verify Crop Ownership and Farm Association if supplied
  let crop: CropContext | null = null;
  let cropAgeDays: number | null = null;

  if (cropId) {
    const { data: cropData, error: cropError } = await supabase
      .from("crops")
      .select("id, farm_id, crop_name, variety, planting_date, expected_harvest_date, status")
      .eq("id", cropId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !cropData) {
      return { error: "Crop not found or access denied." };
    }

    crop = cropData as CropContext;

    // Calculate cropAgeDays server-side from planting_date
    if (crop.planting_date) {
      const plantingDate = new Date(crop.planting_date);
      const currentDate = new Date();

      plantingDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate.getTime() - plantingDate.getTime();
      cropAgeDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }
  }

  // 3. Fetch latest soil reading for the farm
  const { data: soilReadings } = await supabase
    .from("soil_readings")
    .select("ph, nitrogen, phosphorus, potassium, moisture, temperature, organic_carbon, recorded_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(1);

  const soil = soilReadings && soilReadings.length > 0 ? (soilReadings[0] as SoilContext) : null;

  // 4. Fetch latest weather record
  const { data: weatherRecords } = await supabase
    .from("weather_records")
    .select("temperature, humidity, rain_probability, wind_speed, weather_condition, forecast_date")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const weather = weatherRecords && weatherRecords.length > 0 ? (weatherRecords[0] as WeatherContext) : null;

  // 5. Fetch recent disease analyses for the crop
  let diseases: DiseaseContext[] = [];
  if (cropId) {
    const { data: diseaseData } = await supabase
      .from("disease_analyses")
      .select("disease_name, confidence, severity, risk_level, symptoms, created_at")
      .eq("crop_id", cropId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (diseaseData) {
      diseases = diseaseData as DiseaseContext[];
    }
  }

  // 6. Fetch recent unread alerts for the farm/crop
  let alerts: AlertContext[] = [];
  let alertsQuery = supabase
    .from("alerts")
    .select("alert_type, severity, title, message, created_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (cropId) {
    alertsQuery = alertsQuery.or(`crop_id.eq.${cropId},crop_id.is.null`);
  } else {
    alertsQuery = alertsQuery.is("crop_id", null);
  }

  const { data: alertsData } = await alertsQuery
    .order("created_at", { ascending: false })
    .limit(10);

  if (alertsData) {
    alerts = alertsData as AlertContext[];
  }

  return {
    data: {
      farm: farm as FarmContext,
      crop,
      cropAgeDays,
      soil,
      weather,
      diseases,
      alerts,
    },
  };
}

import { generateRecommendations, RecommendationAnalysis } from "@/src/lib/ai/recommendation-engine";

export async function getRecommendationsForCrop(
  farmId: string,
  cropId?: string
): Promise<{ data?: RecommendationAnalysis; error?: string }> {
  // 1. Fetch context (verifies authentication & ownership)
  const contextRes = await getRecommendationContext(farmId, cropId);
  if (contextRes.error || !contextRes.data) {
    return { error: contextRes.error || "Unable to gather telemetry context." };
  }

  // 2. Generate recommendations using Gemini
  try {
    const recommendations = await generateRecommendations(contextRes.data);
    return { data: recommendations };
  } catch (err: any) {
    console.error("AI Recommendation Generation Error:", err);
    return { error: err.message || "Unable to generate recommendations right now. Please try again." };
  }
}

export interface RecommendationRecord {
  id: string;
  farm_id: string;
  crop_id: string | null;
  type: "disease" | "irrigation" | "soil" | "weather" | "general";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  source: string | null;
  confidence: number | null;
  created_at: string;
  expires_at: string | null;
}

export async function logAIRecommendation(
  farmId: string,
  cropId: string | null | undefined,
  analysis: any
): Promise<{ success?: boolean; message?: string; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (cropId && !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to save recommendations." };
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

  // Verify crop ownership and farm association
  if (cropId) {
    const { data: crop, error: cropError } = await supabase
      .from("crops")
      .select("id")
      .eq("id", cropId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !crop) {
      return { error: "Crop not found or access denied." };
    }
  }

  // Validate the input analysis schema
  if (!analysis || !Array.isArray(analysis.recommendations)) {
    return { error: "Invalid recommendations payload." };
  }

  try {
    const validTypes = ["disease", "irrigation", "soil", "weather", "general"];
    const validPriorities = ["low", "medium", "high", "critical"];

    let savedCount = 0;
    let duplicateCount = 0;

    for (const rec of analysis.recommendations) {
      // Validate type
      if (!validTypes.includes(rec.type)) {
        return { error: `Invalid recommendation type: ${rec.type}` };
      }
      // Validate priority
      if (!validPriorities.includes(rec.priority)) {
        return { error: `Invalid recommendation priority: ${rec.priority}` };
      }
      // Validate title & description strings
      if (
        typeof rec.title !== "string" ||
        !rec.title.trim() ||
        typeof rec.description !== "string" ||
        !rec.description.trim()
      ) {
        return { error: "Advisory title and description cannot be empty." };
      }

      const trimmedTitle = rec.title.trim();
      const trimmedDescription = rec.description.trim();

      // Check size
      if (trimmedDescription.length > 50000) {
        return { error: "Description size exceeds limit." };
      }

      const confidence =
        typeof rec.confidence === "number" && !isNaN(rec.confidence)
          ? Math.min(100, Math.max(0, rec.confidence))
          : null;

      // Duplicate Prevention check:
      // Check if an identical unread/recent recommendation exists in the last 1 hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      let dupQuery = supabase
        .from("recommendations")
        .select("id")
        .eq("user_id", user.id)
        .eq("farm_id", farmId)
        .eq("type", rec.type)
        .eq("title", trimmedTitle)
        .gte("created_at", oneHourAgo.toISOString());

      if (cropId) {
        dupQuery = dupQuery.eq("crop_id", cropId);
      } else {
        dupQuery = dupQuery.is("crop_id", null);
      }

      const { data: existingDup } = await dupQuery.limit(1).maybeSingle();

      if (existingDup) {
        duplicateCount++;
        continue;
      }

      // Combine description and actions
      let fullDesc = trimmedDescription;
      if (Array.isArray(rec.actions) && rec.actions.length > 0) {
        fullDesc += "\n\nRecommended actions:\n" + rec.actions.map((act: string) => `• ${act}`).join("\n");
      }

      // Calculate appropriate expiration based on type
      let expiresAt: string | null = null;
      const now = new Date();
      if (rec.type === "weather") {
        now.setHours(now.getHours() + 6); // Weather recommendations expire in 6 hours
        expiresAt = now.toISOString();
      } else if (rec.type === "soil" || rec.type === "irrigation") {
        now.setHours(now.getHours() + 12); // Soil/irrigation expire in 12 hours
        expiresAt = now.toISOString();
      }

      // Insert record
      const { error: insertError } = await supabase.from("recommendations").insert({
        user_id: user.id,
        farm_id: farmId,
        crop_id: cropId || null,
        type: rec.type,
        title: trimmedTitle,
        description: fullDesc,
        priority: rec.priority,
        source: "gemini-3.6-flash",
        confidence,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("DB Save Error on recommendation insertion:", insertError.message);
        throw new Error("Unable to save recommendations.");
      }

      savedCount++;
    }

    if (savedCount === 0 && duplicateCount > 0) {
      return { success: true, message: "duplicate" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error inside logAIRecommendation server action:", err);
    return { error: "Unable to save recommendations right now. Please try again." };
  }
}

export async function getRecommendationHistory(
  farmId: string,
  cropId?: string
): Promise<{ data?: RecommendationRecord[]; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (cropId && !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to retrieve recommendation history." };
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

  // Verify crop ownership and farm association if supplied
  if (cropId) {
    const { data: crop, error: cropError } = await supabase
      .from("crops")
      .select("id")
      .eq("id", cropId)
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !crop) {
      return { error: "Crop not found or access denied." };
    }
  }

  // Fetch history list
  let query = supabase
    .from("recommendations")
    .select("id, farm_id, crop_id, type, title, description, priority, source, confidence, created_at, expires_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id);

  if (cropId) {
    query = query.eq("crop_id", cropId);
  } else {
    query = query.is("crop_id", null);
  }

  const { data: records, error } = await query
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error retrieving recommendations history:", error.message);
    return { error: "Unable to load recommendation history." };
  }

  return { data: records as RecommendationRecord[] };
}
