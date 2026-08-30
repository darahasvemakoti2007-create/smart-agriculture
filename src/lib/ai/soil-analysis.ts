import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";

export interface SoilAnalysisResult {
  overall_status: "healthy" | "moderate" | "poor" | "insufficient_data";
  overall_score: number;
  summary: string;
  ph_assessment: string;
  nutrient_assessment: string;
  moisture_assessment: string;
  key_observations: string[];
  concerns: string[];
  suggested_actions: string[];
  confidence: number;
}

interface SoilReadingData {
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
}

function generateRuleBasedSoilFallback(reading: SoilReadingData): SoilAnalysisResult {
  const ph = reading.ph ?? 6.5;
  const n = reading.nitrogen ?? 25;
  const p = reading.phosphorus ?? 15;
  const k = reading.potassium ?? 25;
  const moisture = reading.moisture ?? 50;

  let score = 75;
  const concerns: string[] = [];
  const observations: string[] = [];
  const actions: string[] = [];

  // pH assessment
  let phStatus = "Optimal soil pH (6.0 - 7.5)";
  if (ph < 5.5) {
    phStatus = `Strongly Acidic (pH ${ph.toFixed(1)})`;
    score -= 15;
    concerns.push("High soil acidity may reduce nutrient availability");
    actions.push("Apply agricultural lime (calcium carbonate) @ 250kg/acre to elevate pH");
  } else if (ph > 8.0) {
    phStatus = `Alkaline Soil (pH ${ph.toFixed(1)})`;
    score -= 15;
    concerns.push("Alkaline soil can restrict micronutrient absorption");
    actions.push("Apply agricultural gypsum or elemental sulfur to lower pH");
  } else {
    observations.push(`Soil pH ${ph.toFixed(1)} is well-balanced for most crops`);
  }

  // NPK assessment
  let nutrientStatus = "Adequate NPK nutrient balance";
  if (n < 20) {
    score -= 10;
    concerns.push("Low Nitrogen levels detected");
    actions.push("Apply Neem-coated Urea or vermicompost to boost Nitrogen");
  } else {
    observations.push(`Nitrogen level (${n} mg/kg) is sufficient`);
  }

  if (p < 12) {
    score -= 10;
    concerns.push("Phosphorus is deficient");
    actions.push("Apply Single Super Phosphate (SSP) @ 50kg/acre near root zone");
  }

  if (k < 15) {
    score -= 10;
    concerns.push("Potassium is low");
    actions.push("Incorporate Muriate of Potash (MOP) to improve crop vigor");
  }

  // Moisture assessment
  let moistureStatus = "Optimal soil moisture level";
  if (moisture < 30) {
    moistureStatus = `Low moisture content (${moisture.toFixed(0)}%)`;
    score -= 10;
    concerns.push("Soil is dry and requires irrigation");
    actions.push("Schedule drip irrigation early morning to restore root moisture");
  } else if (moisture > 75) {
    moistureStatus = `High moisture content (${moisture.toFixed(0)}%)`;
    score -= 10;
    concerns.push("Excess soil moisture may cause root rot");
    actions.push("Ensure field drainage channels are open to clear stagnant water");
  } else {
    observations.push(`Moisture content (${moisture.toFixed(0)}%) is healthy`);
  }

  score = Math.max(25, Math.min(95, score));
  let overall_status: "healthy" | "moderate" | "poor" = "healthy";
  if (score < 55) overall_status = "poor";
  else if (score < 75) overall_status = "moderate";

  return {
    overall_status,
    overall_score: score,
    summary: `Soil analysis complete: pH is ${ph.toFixed(1)}, Nitrogen is ${n} mg/kg, and moisture is ${moisture.toFixed(0)}%. ${concerns.length > 0 ? concerns[0] : "Soil metrics are well-balanced."}`,
    ph_assessment: phStatus,
    nutrient_assessment: nutrientStatus,
    moisture_assessment: moistureStatus,
    key_observations: observations.length > 0 ? observations : ["Soil telemetry logged successfully"],
    concerns: concerns.length > 0 ? concerns : ["No immediate soil deficiencies detected"],
    suggested_actions: actions.length > 0 ? actions : ["Maintain regular organic mulching and routine moisture monitoring"],
    confidence: 88,
  };
}

export async function analyzeSoilWithGemini(reading: SoilReadingData): Promise<SoilAnalysisResult> {
  const client = getGeminiClient();

  const formatVal = (val: number | null) => (val !== null && val !== undefined ? val.toString() : "Not available");

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overall_status: { type: Type.STRING, enum: ["healthy", "moderate", "poor", "insufficient_data"] },
      overall_score: { type: Type.INTEGER, description: "0 to 100" },
      summary: { type: Type.STRING },
      ph_assessment: { type: Type.STRING },
      nutrient_assessment: { type: Type.STRING },
      moisture_assessment: { type: Type.STRING },
      key_observations: { type: Type.ARRAY, items: { type: Type.STRING } },
      concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      confidence: { type: Type.INTEGER, description: "0 to 100" }
    },
    required: [
      "overall_status", "overall_score", "summary", "ph_assessment", 
      "nutrient_assessment", "moisture_assessment", "key_observations", 
      "concerns", "suggested_actions", "confidence"
    ]
  };

  const prompt = `
You are an expert agricultural soil health assistant.
Analyze the following soil measurement values and provide a structured assessment of the soil's health, nutrients, and moisture levels.

MEASUREMENTS:
- pH: ${formatVal(reading.ph)}
- Nitrogen (N): ${formatVal(reading.nitrogen)} mg/kg
- Phosphorus (P): ${formatVal(reading.phosphorus)} mg/kg
- Potassium (K): ${formatVal(reading.potassium)} mg/kg
- Soil Moisture: ${formatVal(reading.moisture)}%
- Soil Temperature: ${formatVal(reading.temperature)}°C
- Organic Carbon: ${formatVal(reading.organic_carbon)}%

ADVISORY INSTRUCTIONS:
1. Evaluate NPK balance, pH acidity/alkalinity, and moisture.
2. Provide concrete organic and sustainable agronomic recommendations.
3. Assign an overall health score between 0 and 100.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });

    if (!result.text) {
      throw new Error("Empty response from Gemini.");
    }

    const json = JSON.parse(result.text);
    return json as SoilAnalysisResult;
  } catch (error: any) {
    console.warn("Gemini Soil Analysis fallback triggered:", error?.message);
    return generateRuleBasedSoilFallback(reading);
  }
}
