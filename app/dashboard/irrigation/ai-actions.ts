"use server";

import { getIrrigationContext } from "@/app/dashboard/irrigation/actions";
import { analyzeIrrigationWithGemini, IrrigationAnalysisResult } from "@/src/lib/ai/irrigation-analysis";
import { createClient } from "@/src/lib/supabase/server";

export async function analyzeIrrigationNeed(
  farmId: string,
  cropId: string
): Promise<{ data?: IrrigationAnalysisResult; error?: string }> {
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }
  if (!cropId || !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to perform AI irrigation analysis." };
  }

  // 2. Fetch context securely (which also verifies farm & crop ownership)
  const contextResult = await getIrrigationContext(farmId, cropId);
  if (contextResult.error || !contextResult.data) {
    return { error: contextResult.error || "Unable to load data for this farm and crop." };
  }

  try {
    const analysis = await analyzeIrrigationWithGemini(contextResult.data);

    // 3. Robust AI output validation
    if (typeof analysis.irrigation_needed !== "boolean") {
      return { error: "AI response validation failed: Invalid irrigation requirement flag." };
    }

    const validUrgencies = ["none", "low", "moderate", "high"];
    if (!validUrgencies.includes(analysis.urgency)) {
      return { error: "AI response validation failed: Invalid urgency category." };
    }

    if (
      typeof analysis.estimated_duration_minutes !== "number" ||
      isNaN(analysis.estimated_duration_minutes) ||
      analysis.estimated_duration_minutes < 0
    ) {
      return { error: "AI response validation failed: Invalid duration value." };
    }

    if (
      typeof analysis.confidence !== "number" ||
      isNaN(analysis.confidence) ||
      analysis.confidence < 0 ||
      analysis.confidence > 100
    ) {
      return { error: "AI response validation failed: Invalid confidence score." };
    }

    // Validate textual descriptions
    const textFields: (keyof IrrigationAnalysisResult)[] = [
      "recommendation",
      "recommended_time",
      "reasoning",
      "weather_consideration",
      "soil_consideration",
      "crop_consideration",
      "water_saving_tip",
    ];

    for (const field of textFields) {
      if (typeof analysis[field] !== "string" || !analysis[field]) {
        return { error: `AI response validation failed: Missing descriptive text for ${String(field)}.` };
      }
    }

    return { data: analysis };
  } catch (err: any) {
    console.error("AI Irrigation Action Error:", err);
    return { error: err.message || "Unable to analyze irrigation needs right now. Please try again." };
  }
}
