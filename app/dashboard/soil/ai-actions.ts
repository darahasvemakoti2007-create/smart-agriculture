"use server";

import { createClient } from "@/src/lib/supabase/server";
import { analyzeSoilWithGemini, SoilAnalysisResult } from "@/src/lib/ai/soil-analysis";

export async function analyzeSoilReading(
  readingId: string,
  farmId: string
): Promise<{ data?: SoilAnalysisResult; error?: string }> {
  // Validate formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!readingId || !uuidRegex.test(readingId)) {
    return { error: "Invalid soil reading identifier." };
  }
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to perform AI analysis." };
  }

  // Fetch and verify soil reading ownership and farm context
  const { data: reading, error: readingError } = await supabase
    .from("soil_readings")
    .select("id, farm_id, user_id, ph, nitrogen, phosphorus, potassium, moisture, temperature, organic_carbon")
    .eq("id", readingId)
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .single();

  if (readingError || !reading) {
    return { error: "Soil reading not found or you do not have permission to analyze it." };
  }

  try {
    const analysis = await analyzeSoilWithGemini({
      ph: reading.ph,
      nitrogen: reading.nitrogen,
      phosphorus: reading.phosphorus,
      potassium: reading.potassium,
      moisture: reading.moisture,
      temperature: reading.temperature,
      organic_carbon: reading.organic_carbon,
    });

    return { data: analysis };
  } catch (err: any) {
    console.error("AI Soil Analysis Action Error:", err);
    return { error: err.message || "Unable to analyze soil right now. Please try again." };
  }
}
