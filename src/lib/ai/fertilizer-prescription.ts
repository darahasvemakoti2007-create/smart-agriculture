import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";

// 1. Export interfaces/types
export interface FertilizerPrescriptionInput {
  farm: {
    farm_name: string;
    area: number | null;
    soil_type: string | null;
  };
  crop: {
    crop_name: string;
    variety: string | null;
    planting_date: string | null;
    status: string | null;
  };
  soil: {
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
    moisture: number | null;
    temperature: number | null;
    organic_carbon: number | null;
    recorded_at: string;
  };
}

export interface NutrientAnalysisItem {
  status: "low" | "adequate" | "high" | "unknown" | "acidic" | "optimal" | "alkaline";
  observation: string;
}

export interface NutrientAnalysis {
  nitrogen: NutrientAnalysisItem;
  phosphorus: NutrientAnalysisItem;
  potassium: NutrientAnalysisItem;
  ph: NutrientAnalysisItem;
}

export interface FertilizerPlanItem {
  fertilizer_name: string;
  purpose: string;
  application_guidance: string;
  priority: "low" | "medium" | "high" | "critical";
}

export interface FertilizerPrescription {
  overall_status: "healthy" | "attention_required" | "critical" | "insufficient_data";
  overall_priority: "low" | "medium" | "high" | "critical";
  summary: string;
  nutrient_analysis: NutrientAnalysis;
  fertilizer_plan: FertilizerPlanItem[];
  organic_alternatives: string[];
  action_checklist: string[];
  cautions: string[];
  confidence: number;
}

// 2. Define Gemini Response Schema
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_status: {
      type: Type.STRING,
      enum: ["healthy", "attention_required", "critical", "insufficient_data"],
    },
    overall_priority: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    summary: { type: Type.STRING },
    nutrient_analysis: {
      type: Type.OBJECT,
      properties: {
        nitrogen: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
            observation: { type: Type.STRING },
          },
          required: ["status", "observation"],
        },
        phosphorus: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
            observation: { type: Type.STRING },
          },
          required: ["status", "observation"],
        },
        potassium: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
            observation: { type: Type.STRING },
          },
          required: ["status", "observation"],
        },
        ph: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["acidic", "optimal", "alkaline", "unknown"] },
            observation: { type: Type.STRING },
          },
          required: ["status", "observation"],
        },
      },
      required: ["nitrogen", "phosphorus", "potassium", "ph"],
    },
    fertilizer_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fertilizer_name: { type: Type.STRING },
          purpose: { type: Type.STRING },
          application_guidance: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
        },
        required: ["fertilizer_name", "purpose", "application_guidance", "priority"],
      },
    },
    organic_alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    action_checklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    cautions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    confidence: { type: Type.INTEGER },
  },
  required: [
    "overall_status",
    "overall_priority",
    "summary",
    "nutrient_analysis",
    "fertilizer_plan",
    "organic_alternatives",
    "action_checklist",
    "cautions",
    "confidence",
  ],
};

/**
 * Generate a structured fertilizer prescription plan using Gemini 3.6 Flash
 */
export async function generateFertilizerPrescription(
  context: FertilizerPrescriptionInput
): Promise<FertilizerPrescription> {
  const client = getGeminiClient();

  const formatVal = (val: any, unit: string = "") => {
    return val !== null && val !== undefined ? `${val}${unit}` : "Not available";
  };

  const prompt = `
You are an expert soil chemistry and fertilizer advisory agent.
Analyze the following soil telemetry and crop details to prescribe a precise organic/chemical nutrient management program.

FARM DETAILS:
- Farm Name: ${context.farm.farm_name}
- Farm Area: ${formatVal(context.farm.area, " acres")}
- Soil Type: ${formatVal(context.farm.soil_type)}

CROP IN CONTEXT:
- Crop Name: ${context.crop.crop_name}
- Variety: ${formatVal(context.crop.variety)}
- Planting Date: ${formatVal(context.crop.planting_date)}
- Current Status: ${formatVal(context.crop.status)}

SOIL CHEMISTRY METRICS:
- Nitrogen (N): ${formatVal(context.soil.nitrogen, " mg/kg")}
- Phosphorus (P): ${formatVal(context.soil.phosphorus, " mg/kg")}
- Potassium (K): ${formatVal(context.soil.potassium, " mg/kg")}
- Soil pH: ${formatVal(context.soil.ph)}
- Soil Moisture: ${formatVal(context.soil.moisture, "%")}
- Soil Temperature: ${formatVal(context.soil.temperature, "°C")}
- Organic Carbon: ${formatVal(context.soil.organic_carbon, "%")}
- Reading Date: ${context.soil.recorded_at}

CRITICAL RULES:
1. Do not invent missing soil measurements. Do not claim a nutrient is deficient solely because a value is missing; mark its status as "unknown" if missing.
2. Consider the specific crop type and variety when formulating fertilizer prescriptions.
3. Treat recommended chemical quantities or applications as general agricultural guidance, not absolute laboratory prescriptions.
4. Avoid prescribing dangerous chemical mixtures. Suggest practical, sustainable soil enhancement methods.
5. If pH is acidic or alkaline, explain how this affects the availability of Nitrogen, Phosphorus, and Potassium in the soil observations.
6. If critical soil values (N, P, K, pH) are entirely missing or mostly unavailable (such that you cannot compile a meaningful plan), set overall_status to "insufficient_data" and output a summary explaining the missing requirements.
7. Explicitly separate observed telemetry facts from future recommendations.
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

    const prescription = JSON.parse(result.text) as FertilizerPrescription;

    // Validate parsed output strictly
    validatePrescription(prescription);

    return prescription;
  } catch (error: any) {
    console.error("Gemini Fertilizer Prescription Engine Error:", error);
    // Suppress internal stack traces/keys, throw safe message
    throw new Error("Unable to generate fertilizer advice at this time.");
  }
}

/**
 * Strict validator for Gemini structured output
 */
function validatePrescription(p: any): void {
  if (!p) throw new Error("Null response");

  const validStatuses = ["healthy", "attention_required", "critical", "insufficient_data"];
  if (!validStatuses.includes(p.overall_status)) {
    throw new Error("Invalid overall status");
  }

  const validPriorities = ["low", "medium", "high", "critical"];
  if (!validPriorities.includes(p.overall_priority)) {
    throw new Error("Invalid overall priority");
  }

  if (typeof p.confidence !== "number" || p.confidence < 0 || p.confidence > 100) {
    throw new Error("Confidence must be a percentage between 0 and 100");
  }

  if (!p.nutrient_analysis) {
    throw new Error("Nutrient analysis block is missing");
  }

  const checkNutrient = (item: any, allowed: string[]) => {
    if (!item || !item.status || typeof item.observation !== "string") {
      throw new Error("Nutrient item validation failed");
    }
    if (!allowed.includes(item.status)) {
      throw new Error(`Invalid status enum value: ${item.status}`);
    }
  };

  const npkStatuses = ["low", "adequate", "high", "unknown"];
  const phStatuses = ["acidic", "optimal", "alkaline", "unknown"];

  checkNutrient(p.nutrient_analysis.nitrogen, npkStatuses);
  checkNutrient(p.nutrient_analysis.phosphorus, npkStatuses);
  checkNutrient(p.nutrient_analysis.potassium, npkStatuses);
  checkNutrient(p.nutrient_analysis.ph, phStatuses);

  if (!Array.isArray(p.fertilizer_plan)) {
    throw new Error("Fertilizer plan must be an array");
  }

  for (const item of p.fertilizer_plan) {
    if (
      !item.fertilizer_name ||
      !item.purpose ||
      !item.application_guidance ||
      !validPriorities.includes(item.priority)
    ) {
      throw new Error("Invalid fertilizer plan item structure");
    }
  }

  if (
    !Array.isArray(p.organic_alternatives) ||
    !p.organic_alternatives.every((x: any) => typeof x === "string")
  ) {
    throw new Error("organic_alternatives must be an array of strings");
  }

  if (!Array.isArray(p.action_checklist) || !p.action_checklist.every((x: any) => typeof x === "string")) {
    throw new Error("action_checklist must be an array of strings");
  }

  if (!Array.isArray(p.cautions) || !p.cautions.every((x: any) => typeof x === "string")) {
    throw new Error("cautions must be an array of strings");
  }
}
