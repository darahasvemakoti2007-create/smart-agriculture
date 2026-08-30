"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface FarmContext {
  id: string;
  farm_name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
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

export interface WeatherContext {
  temperature: number | null;
  humidity: number | null;
  rain_probability: number | null;
  wind_speed: number | null;
  weather_condition: string | null;
  forecast_date: string | null;
  created_at: string;
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

export interface IrrigationContext {
  farm: FarmContext;
  crop: CropContext;
  cropAgeDays: number | null;
  weather: WeatherContext | null;
  soil: SoilContext | null;
}

export async function getIrrigationContext(
  farmId: string,
  cropId: string
): Promise<{ data?: IrrigationContext; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (!cropId || !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to retrieve irrigation context." };
  }

  // 1. Verify farm ownership & fetch info
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, farm_name, location, latitude, longitude")
    .eq("id", farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or you do not have permission to access it." };
  }

  // 2. Verify crop ownership & fetch info
  const { data: crop, error: cropError } = await supabase
    .from("crops")
    .select("id, farm_id, crop_name, variety, planting_date, expected_harvest_date, status")
    .eq("id", cropId)
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .single();

  if (cropError || !crop) {
    return { error: "Crop not found, does not belong to this farm, or you lack access permissions." };
  }

  // 3. Calculate crop age (days since planting) server-side
  let cropAgeDays: number | null = null;
  if (crop.planting_date) {
    const plantingDate = new Date(crop.planting_date);
    const currentDate = new Date();
    
    // Clear time portions to calculate date diff exactly
    plantingDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    const diffTime = currentDate.getTime() - plantingDate.getTime();
    cropAgeDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  // 4. Fetch the latest weather record
  const { data: weatherRecords } = await supabase
    .from("weather_records")
    .select("temperature, humidity, rain_probability, wind_speed, weather_condition, forecast_date, created_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const weather = weatherRecords && weatherRecords.length > 0 ? (weatherRecords[0] as WeatherContext) : null;

  // 5. Fetch the latest soil reading
  const { data: soilReadings } = await supabase
    .from("soil_readings")
    .select("ph, nitrogen, phosphorus, potassium, moisture, temperature, organic_carbon, recorded_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(1);

  const soil = soilReadings && soilReadings.length > 0 ? (soilReadings[0] as SoilContext) : null;

  return {
    data: {
      farm: farm as FarmContext,
      crop: crop as CropContext,
      cropAgeDays,
      weather,
      soil,
    },
  };
}

export interface LogIrrigationInput {
  farmId: string;
  cropId: string;
  recommendation: string;
  recommendedTime?: string;
  estimatedDurationMinutes?: number;
  confidence?: number;
}

export async function logIrrigationRecord(
  input: LogIrrigationInput
): Promise<{ success?: boolean; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!input.farmId || !uuidRegex.test(input.farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (!input.cropId || !uuidRegex.test(input.cropId)) {
    return { error: "Invalid crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to log irrigation runs." };
  }

  // 1. Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id")
    .eq("id", input.farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or access denied." };
  }

  // 2. Verify crop ownership & farm association
  const { data: crop, error: cropError } = await supabase
    .from("crops")
    .select("id")
    .eq("id", input.cropId)
    .eq("farm_id", input.farmId)
    .eq("user_id", user.id)
    .single();

  if (cropError || !crop) {
    return { error: "Crop not found or access denied." };
  }

  // 3. Server-side validation
  if (!input.recommendation || input.recommendation.trim() === "") {
    return { error: "Recommendation text is required." };
  }
  const cleanRecommendation = input.recommendation.trim().slice(0, 5000); // Enforce reasonable max length

  if (
    input.estimatedDurationMinutes !== undefined &&
    (isNaN(input.estimatedDurationMinutes) || input.estimatedDurationMinutes < 0)
  ) {
    return { error: "Duration must be a positive integer." };
  }

  if (
    input.confidence !== undefined &&
    (isNaN(input.confidence) || input.confidence < 0 || input.confidence > 100)
  ) {
    return { error: "Confidence must be between 0 and 100." };
  }

  // Parse recommended time timestamp securely
  let parsedRecommendedTime: string | null = null;
  if (input.recommendedTime) {
    const ts = Date.parse(input.recommendedTime);
    if (!isNaN(ts)) {
      parsedRecommendedTime = new Date(ts).toISOString();
    }
  }

  // 4. Fetch the latest soil moisture server-side (do not trust browser)
  const { data: soilReadings } = await supabase
    .from("soil_readings")
    .select("moisture")
    .eq("farm_id", input.farmId)
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(1);

  const soilMoisture = soilReadings && soilReadings.length > 0 ? soilReadings[0].moisture : null;

  // 5. Insert into Supabase irrigation_records
  const finalDuration = input.estimatedDurationMinutes !== undefined && input.estimatedDurationMinutes > 0
    ? input.estimatedDurationMinutes
    : null;

  const finalConfidence = input.confidence !== undefined
    ? input.confidence
    : null;

  const { error: insertError } = await supabase.from("irrigation_records").insert({
    farm_id: input.farmId,
    crop_id: input.cropId,
    user_id: user.id,
    soil_moisture: soilMoisture,
    recommendation: cleanRecommendation,
    recommended_time: parsedRecommendedTime,
    estimated_duration_minutes: finalDuration,
    confidence: finalConfidence,
  });

  if (insertError) {
    console.error("Error logging irrigation run:", insertError.message);
    return { error: "Failed to save the irrigation log to the database." };
  }

  // 6. Trigger revalidation
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/dashboard/irrigation");
  revalidatePath("/dashboard");

  return { success: true };
}

export interface IrrigationHistoryRecord {
  id: string;
  soil_moisture: number | null;
  recommendation: string;
  recommended_time: string | null;
  estimated_duration_minutes: number | null;
  confidence: number | null;
  created_at: string;
  crops: {
    crop_name: string;
  } | null;
}

export async function getIrrigationHistory(
  farmId: string
): Promise<{ data?: IrrigationHistoryRecord[]; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to view irrigation history." };
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

  const { data: records, error: queryError } = await supabase
    .from("irrigation_records")
    .select("id, soil_moisture, recommendation, recommended_time, estimated_duration_minutes, confidence, created_at, crops (crop_name)")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (queryError) {
    console.error("Error retrieving irrigation history:", queryError.message);
    return { error: "Failed to load irrigation history." };
  }

  return { data: records as any[] as IrrigationHistoryRecord[] };
}
