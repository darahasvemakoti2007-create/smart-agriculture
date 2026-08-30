import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";

export interface CropRotationInput {
  farm: {
    farm_name: string;
    area: number | null;
    soil_type: string | null;
  };
  crops: Array<{
    id: string;
    crop_name: string;
    variety: string | null;
    status: string | null;
    planting_date: string | null;
    expected_harvest_date: string | null;
  }>;
  soilReadings: Array<{
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
    moisture: number | null;
    temperature: number | null;
    organic_carbon: number | null;
    recorded_at: string;
  }>;
}

export interface SoilAssessment {
  nitrogen_status: "low" | "adequate" | "high" | "unknown";
  phosphorus_status: "low" | "adequate" | "high" | "unknown";
  potassium_status: "low" | "adequate" | "high" | "unknown";
  ph_status: "acidic" | "optimal" | "alkaline" | "unknown";
  observations: string[];
}

export interface RotationPlanItem {
  crop_name: string;
  reason: string;
  soil_benefit: string;
  nitrogen_effect: "fixing" | "neutral" | "depleting" | "unknown";
  priority: "low" | "medium" | "high";
}

export interface CropRotationAdvisory {
  overall_status: "healthy" | "attention_required" | "soil_recovery_needed" | "insufficient_data";
  overall_priority: "low" | "medium" | "high" | "critical";
  summary: string;
  soil_assessment: SoilAssessment;
  rotation_plan: RotationPlanItem[];
  recovery_actions: string[];
  crops_to_avoid_temporarily: string[];
  sustainability_tips: string[];
  confidence: number;
}

// response schema for Gemini
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_status: {
      type: Type.STRING,
      enum: ["healthy", "attention_required", "soil_recovery_needed", "insufficient_data"],
    },
    overall_priority: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    summary: { type: Type.STRING },
    soil_assessment: {
      type: Type.OBJECT,
      properties: {
        nitrogen_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        phosphorus_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        potassium_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        ph_status: { type: Type.STRING, enum: ["acidic", "optimal", "alkaline", "unknown"] },
        observations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["nitrogen_status", "phosphorus_status", "potassium_status", "ph_status", "observations"],
    },
    rotation_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          crop_name: { type: Type.STRING },
          reason: { type: Type.STRING },
          soil_benefit: { type: Type.STRING },
          nitrogen_effect: { type: Type.STRING, enum: ["fixing", "neutral", "depleting", "unknown"] },
          priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
        },
        required: ["crop_name", "reason", "soil_benefit", "nitrogen_effect", "priority"],
      },
    },
    recovery_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    crops_to_avoid_temporarily: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    sustainability_tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    confidence: { type: Type.INTEGER },
  },
  required: [
    "overall_status",
    "overall_priority",
    "summary",
    "soil_assessment",
    "rotation_plan",
    "recovery_actions",
    "crops_to_avoid_temporarily",
    "sustainability_tips",
    "confidence",
  ],
};

/**
 * Generate crop rotation and soil recovery advice using Gemini 3.6 Flash
 */
export async function generateCropRotationAnalysis(
  input: CropRotationInput
): Promise<CropRotationAdvisory> {
  const client = getGeminiClient();

  const formatVal = (val: any, unit: string = "") => {
    return val !== null && val !== undefined ? `${val}${unit}` : "Not available";
  };

  // Serialize history
  const cropsText =
    input.crops.length === 0
      ? "No cultivation crop history recorded."
      : input.crops
          .map(
            (c) =>
              `- Crop Name: ${c.crop_name} ${c.variety ? `(${c.variety})` : ""}, Status: ${c.status || "active"}, Planted: ${formatVal(c.planting_date)}, Harvested: ${formatVal(c.expected_harvest_date)}`
          )
          .join("\n");

  const soilText =
    input.soilReadings.length === 0
      ? "No recent soil health telemetry recorded."
      : input.soilReadings
          .slice(0, 5) // Show top 5 to evaluate trends in prompt context
          .map(
            (s, idx) =>
              `Log #${idx + 1} (${s.recorded_at}):
  - Nitrogen (N): ${formatVal(s.nitrogen, " mg/kg")}
  - Phosphorus (P): ${formatVal(s.phosphorus, " mg/kg")}
  - Potassium (K): ${formatVal(s.potassium, " mg/kg")}
  - Soil pH: ${formatVal(s.ph)}
  - Organic Carbon: ${formatVal(s.organic_carbon, "%")}`
          )
          .join("\n\n");

  const prompt = `
You are an expert agronomist, crop rotation planner, and sustainable farming assistant.
Analyze the following farm metadata, historical crops, and recent soil telemetry logs to plan a Crop Rotation Program and Soil Recovery Guide.

FARM INFORMATION:
- Name: ${input.farm.farm_name}
- Area: ${formatVal(input.farm.area, " acres")}
- Soil Type: ${formatVal(input.farm.soil_type)}

HISTORICAL CULTIVATION PATHWAYS:
${cropsText}

RECENT SOIL TELEMETRY TRENDS:
${soilText}

CRITICAL INSTRUCTIONS:
1. Do not invent crop history or previous plantings if missing. Keep the rotation planning focused on the crops registered.
2. Do not invent soil chemistry parameters. If Nitrogen, Phosphorus, Potassium, or pH is missing, mark its status as "unknown".
3. Evaluate soil NPK trends over time (trends from multiple readings) and pH condition to diagnose nutrient depletion curves.
4. Recommend crops that fix Nitrogen (legumes) or break disease cycles depending on previous harvested crop families.
5. Provide actionable soil recovery steps (organic treatments, cover cropping, green manure).
6. List crops to avoid temporarily (e.g. repeated heavy feeders like corn or wheat if soil is depleted).
7. If data is entirely insufficient to propose a sequence (e.g., no crops or soil logs exist), return overall_status = "insufficient_data" and explain what fields need parameters.
8. Treat advisories as general agricultural guidelines. Do not provide dangerous chemical instructions or pesticide recommendations.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    if (!result.text) {
      throw new Error("Empty response from Gemini.");
    }

    const json = JSON.parse(result.text) as CropRotationAdvisory;

    // Validate structured output strictly
    validateAdvisory(json);

    return json;
  } catch (error: any) {
    console.error("Gemini Crop Rotation Engine Error:", error);
    // Suppress internal keys/traces, throw safe exception
    throw new Error("Unable to generate crop rotation advice at this time.");
  }
}

function validateAdvisory(a: any): void {
  if (!a) throw new Error("Null response");

  const validStatuses = ["healthy", "attention_required", "soil_recovery_needed", "insufficient_data"];
  if (!validStatuses.includes(a.overall_status)) {
    throw new Error("Invalid overall status");
  }

  const validPriorities = ["low", "medium", "high", "critical"];
  if (!validPriorities.includes(a.overall_priority)) {
    throw new Error("Invalid overall priority");
  }

  if (typeof a.confidence !== "number" || a.confidence < 0 || a.confidence > 100) {
    throw new Error("Confidence must be between 0 and 100");
  }

  if (!a.soil_assessment) {
    throw new Error("Soil assessment block is missing");
  }

  const checkStatus = (s: string, allowed: string[]) => {
    if (!s || !allowed.includes(s)) {
      throw new Error(`Invalid status enum: ${s}`);
    }
  };

  const npkList = ["low", "adequate", "high", "unknown"];
  const phList = ["acidic", "optimal", "alkaline", "unknown"];

  checkStatus(a.soil_assessment.nitrogen_status, npkList);
  checkStatus(a.soil_assessment.phosphorus_status, npkList);
  checkStatus(a.soil_assessment.potassium_status, npkList);
  checkStatus(a.soil_assessment.ph_status, phList);

  if (!Array.isArray(a.soil_assessment.observations) || !a.soil_assessment.observations.every((x: any) => typeof x === "string")) {
    throw new Error("Soil assessment observations must be an array of strings");
  }

  if (!Array.isArray(a.rotation_plan)) {
    throw new Error("rotation_plan must be an array");
  }

  const validNEffects = ["fixing", "neutral", "depleting", "unknown"];
  const planPriorities = ["low", "medium", "high"];

  for (const item of a.rotation_plan) {
    if (
      !item.crop_name ||
      !item.reason ||
      !item.soil_benefit ||
      !validNEffects.includes(item.nitrogen_effect) ||
      !planPriorities.includes(item.priority)
    ) {
      throw new Error("Invalid rotation plan item properties");
    }
  }

  if (!Array.isArray(a.recovery_actions) || !a.recovery_actions.every((x: any) => typeof x === "string")) {
    throw new Error("recovery_actions must be an array of strings");
  }

  if (
    !Array.isArray(a.crops_to_avoid_temporarily) ||
    !a.crops_to_avoid_temporarily.every((x: any) => typeof x === "string")
  ) {
    throw new Error("crops_to_avoid_temporarily must be an array of strings");
  }

  if (!Array.isArray(a.sustainability_tips) || !a.sustainability_tips.every((x: any) => typeof x === "string")) {
    throw new Error("sustainability_tips must be an array of strings");
  }
}
