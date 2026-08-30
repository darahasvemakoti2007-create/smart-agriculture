import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";
import { IrrigationContext } from "@/app/dashboard/irrigation/actions";

export interface IrrigationAnalysisResult {
  irrigation_needed: boolean;
  urgency: "none" | "low" | "moderate" | "high";
  recommendation: string;
  recommended_time: string;
  estimated_duration_minutes: number;
  confidence: number;
  reasoning: string;
  weather_consideration: string;
  soil_consideration: string;
  crop_consideration: string;
  water_saving_tip: string;
}

function generateRuleBasedIrrigationFallback(context: IrrigationContext): IrrigationAnalysisResult {
  const moisture = context.soil?.moisture ?? 45;
  const rainProb = context.weather?.rain_probability ?? 20;
  const temp = context.weather?.temperature ?? 28;
  const crop = context.crop?.crop_name || "Active crop";

  let needed = false;
  let urgency: "none" | "low" | "moderate" | "high" = "none";
  let duration = 0;
  let recommendedTime = "None";
  let recommendation = "";

  if (rainProb >= 60) {
    needed = false;
    urgency = "none";
    duration = 0;
    recommendedTime = "None";
    recommendation = `High rainfall probability (${rainProb}%). Pause irrigation to prevent root oversaturation and water wastage.`;
  } else if (moisture < 35) {
    needed = true;
    urgency = moisture < 25 ? "high" : "moderate";
    duration = temp > 32 ? 45 : 35;
    recommendedTime = "Early Morning (6:00 AM - 8:00 AM)";
    recommendation = `Low soil moisture (${moisture.toFixed(0)}%) detected. Irrigate ${crop} for ${duration} minutes using drip lines.`;
  } else if (moisture < 50) {
    needed = true;
    urgency = "low";
    duration = 25;
    recommendedTime = "Late Evening (5:30 PM - 7:00 PM)";
    recommendation = `Soil moisture is moderate (${moisture.toFixed(0)}%). Light maintenance irrigation recommended for ${crop}.`;
  } else {
    needed = false;
    urgency = "none";
    duration = 0;
    recommendedTime = "None";
    recommendation = `Soil moisture is adequate (${moisture.toFixed(0)}%). No immediate irrigation required for ${crop}.`;
  }

  return {
    irrigation_needed: needed,
    urgency,
    recommendation,
    recommended_time: recommendedTime,
    estimated_duration_minutes: duration,
    confidence: 90,
    reasoning: `Rule-based agricultural assessment: Soil moisture is ${moisture.toFixed(0)}%, rain probability is ${rainProb}%, and ambient temperature is ${temp}°C.`,
    weather_consideration: rainProb > 50 ? `Rain expected (${rainProb}% chance)` : `Clear weather with ${temp}°C temperature`,
    soil_consideration: `Soil moisture level recorded at ${moisture.toFixed(0)}%`,
    crop_consideration: `${crop} is in active growth phase`,
    water_saving_tip: "Irrigate early in the morning or late in the evening to reduce water loss from evaporation.",
  };
}

export async function analyzeIrrigationWithGemini(
  context: IrrigationContext
): Promise<IrrigationAnalysisResult> {
  const client = getGeminiClient();

  const formatVal = (val: any, suffix = "") =>
    val !== null && val !== undefined ? `${val}${suffix}` : "Not available";

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      irrigation_needed: { type: Type.BOOLEAN },
      urgency: { type: Type.STRING, enum: ["none", "low", "moderate", "high"] },
      recommendation: { type: Type.STRING },
      recommended_time: { type: Type.STRING },
      estimated_duration_minutes: { type: Type.INTEGER, description: "Minutes. Must be 0 if irrigation_needed is false, positive if true." },
      confidence: { type: Type.INTEGER, description: "0 to 100" },
      reasoning: { type: Type.STRING },
      weather_consideration: { type: Type.STRING },
      soil_consideration: { type: Type.STRING },
      crop_consideration: { type: Type.STRING },
      water_saving_tip: { type: Type.STRING }
    },
    required: [
      "irrigation_needed", "urgency", "recommendation", "recommended_time",
      "estimated_duration_minutes", "confidence", "reasoning",
      "weather_consideration", "soil_consideration", "crop_consideration", "water_saving_tip"
    ]
  };

  const prompt = `
You are an expert agricultural irrigation advisor.
Analyze the following farm parameters and return an optimal watering recommendation.

FARM CONTEXT:
- Farm Name: ${formatVal(context.farm?.farm_name)}
- Soil Moisture: ${formatVal(context.soil?.moisture, "%")}
- Rain Probability: ${formatVal(context.weather?.rain_probability, "%")}
- Temperature: ${formatVal(context.weather?.temperature, "°C")}
- Humidity: ${formatVal(context.weather?.humidity, "%")}
- Active Crop: ${formatVal(context.crop?.crop_name)}

ADVISORY RULES:
1. If soil moisture is high or rain probability is high (> 60%), set irrigation_needed = false, urgency = "none", duration = 0.
2. Recommend morning or evening hours for watering.
3. Provide practical water-saving advice.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    if (!result.text) {
      throw new Error("Empty response from Gemini.");
    }

    const json = JSON.parse(result.text);
    return json as IrrigationAnalysisResult;
  } catch (error: any) {
    console.warn("Gemini Irrigation Analysis fallback triggered:", error?.message);
    return generateRuleBasedIrrigationFallback(context);
  }
}
