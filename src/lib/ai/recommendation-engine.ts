import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";
import { RecommendationContext } from "@/app/dashboard/recommendations/actions";

export interface RecommendationItem {
  type: "disease" | "irrigation" | "soil" | "weather" | "general";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  actions: string[];
}

export interface RecommendationAnalysis {
  overall_status: "healthy" | "attention_required" | "critical" | "insufficient_data";
  overall_priority: "low" | "medium" | "high" | "critical";
  summary: string;
  recommendations: RecommendationItem[];
  key_observations: string[];
  risk_factors: string[];
  water_saving_tip: string;
  fertilizer_tip: string;
  confidence: number;
}

export async function generateRecommendations(
  context: RecommendationContext
): Promise<RecommendationAnalysis> {
  const client = getGeminiClient();

  // Helper to format values securely
  const formatVal = (val: any, suffix = "") =>
    val !== null && val !== undefined ? `${val}${suffix}` : "Not available";

  // Build schema using SDK's Schema/Type
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
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["disease", "irrigation", "soil", "weather", "general"],
            },
            priority: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "critical"],
            },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.INTEGER, description: "0 to 100" },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["type", "priority", "title", "description", "confidence", "actions"],
        },
      },
      key_observations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      risk_factors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      water_saving_tip: { type: Type.STRING },
      fertilizer_tip: { type: Type.STRING },
      confidence: { type: Type.INTEGER, description: "0 to 100" },
    },
    required: [
      "overall_status",
      "overall_priority",
      "summary",
      "recommendations",
      "key_observations",
      "risk_factors",
      "water_saving_tip",
      "fertilizer_tip",
      "confidence",
    ],
  };

  const cropPrompt = context.crop
    ? `- Crop Name: ${context.crop.crop_name}
- Variety: ${formatVal(context.crop.variety)}
- Crop Age: ${context.cropAgeDays !== null ? `${context.cropAgeDays} days` : "Not available"}
- Planting Date: ${formatVal(context.crop.planting_date)}
- Expected Harvest: ${formatVal(context.crop.expected_harvest_date)}
- Crop Status: ${context.crop.status}`
    : "No crop registered under this farm.";

  const soilPrompt = context.soil
    ? `- Soil pH: ${formatVal(context.soil.ph)}
- Soil Moisture: ${formatVal(context.soil.moisture, "%")}
- Nitrogen (N): ${formatVal(context.soil.nitrogen, " mg/kg")}
- Phosphorus (P): ${formatVal(context.soil.phosphorus, " mg/kg")}
- Potassium (K): ${formatVal(context.soil.potassium, " mg/kg")}
- Soil Temperature: ${formatVal(context.soil.temperature, "°C")}
- Organic Carbon: ${formatVal(context.soil.organic_carbon, "%")}
- Recorded Timestamp: ${formatVal(context.soil.recorded_at)}`
    : "No recent soil health telemetry logs available.";

  const weatherPrompt = context.weather
    ? `- Current Temperature: ${formatVal(context.weather.temperature, "°C")}
- Current Humidity: ${formatVal(context.weather.humidity, "%")}
- Rain Probability: ${formatVal(context.weather.rain_probability, "%")}
- Wind Speed: ${formatVal(context.weather.wind_speed, " m/s")}
- Condition: ${formatVal(context.weather.weather_condition)}
- Forecast Timestamp: ${formatVal(context.weather.forecast_date)}`
    : "No weather forecast logs available.";

  const diseasePrompt =
    context.diseases && context.diseases.length > 0
      ? context.diseases
          .map(
            (d, idx) =>
              `${idx + 1}. Pathogen/Disease: ${d.disease_name} (Severity: ${formatVal(
                d.severity
              )}, Risk: ${formatVal(d.risk_level)}, Confidence: ${formatVal(
                d.confidence,
                "%"
              )}) - Detected: ${formatVal(d.created_at)}`
          )
          .join("\n")
      : "No crop disease checks logged.";

  const alertPrompt =
    context.alerts && context.alerts.length > 0
      ? context.alerts
          .map(
            (a, idx) =>
              `${idx + 1}. Alert Type: ${a.alert_type} (Severity: ${a.severity}) - Title: ${a.title} - Message: ${a.message} - Fired: ${a.created_at}`
          )
          .join("\n")
      : "No active/unread alerts.";

  const prompt = `
You are an expert agricultural decision-support advisory system.
Evaluate the following complete telemetry dataset for the farmer's agricultural ecosystem and produce prioritized, structured recommendations.

FARM:
- Name: ${context.farm.farm_name}
- Location: ${formatVal(context.farm.location)}
- Area: ${formatVal(context.farm.area)} ${formatVal(context.farm.area_unit)}
- Soil Type: ${formatVal(context.farm.soil_type)}
- Irrigation Setup: ${formatVal(context.farm.irrigation_type)}

CROP DATA:
${cropPrompt}

SOIL HEALTH TELEMETRY:
${soilPrompt}

WEATHER INTELLIGENCE:
${weatherPrompt}

CROP DISEASE ANALYSIS HISTORY:
${diseasePrompt}

ACTIVE UNREAD FARM ALERTS:
${alertPrompt}

CRITICAL RULES FOR RECOMMENDATION:
1. Prioritize advice in this order:
   - Fired critical/high unread alerts
   - Severe disease risks
   - Critically low/high soil moisture or pH
   - Immediate extreme weather forecast warning conditions (e.g. frost mitigation, high winds)
   - Nutrient NPK adjustments
   - General crop stage crop-management advice
2. Rely ONLY on the parameters provided. Do not claim to physically measure or inspect conditions yourself.
3. If parameters (soil, weather, crop age) are marked as "Not available", never assume or invent their values. Address what can be concluded or note that more metrics are required.
4. If there is insufficient evidence to conclude any risk or recommendation, set overall_status to "insufficient_data".
5. Do not suggest dangerous chemical treatments. Favor organic adjustments or standard sustainable farming guidelines.
6. Remember that this is strictly informational decision support. Do not claim absolute laboratory or sensor accuracy. Keep recommendations concise, actionable, and targeted.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    if (!result.text) {
      throw new Error("Empty response from Gemini.");
    }

    const analysis = JSON.parse(result.text) as RecommendationAnalysis;

    // --- Strict Server-Side Validation ---
    const validStatuses = ["healthy", "attention_required", "critical", "insufficient_data"];
    if (!validStatuses.includes(analysis.overall_status)) {
      throw new Error("Invalid overall_status returned by AI.");
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    if (!validPriorities.includes(analysis.overall_priority)) {
      throw new Error("Invalid overall_priority returned by AI.");
    }

    if (
      typeof analysis.summary !== "string" ||
      !analysis.summary.trim() ||
      typeof analysis.water_saving_tip !== "string" ||
      typeof analysis.fertilizer_tip !== "string"
    ) {
      throw new Error("Missing essential descriptive text fields in AI response.");
    }

    if (
      typeof analysis.confidence !== "number" ||
      isNaN(analysis.confidence) ||
      analysis.confidence < 0 ||
      analysis.confidence > 100
    ) {
      throw new Error("AI response confidence score is invalid.");
    }

    if (!Array.isArray(analysis.key_observations) || !Array.isArray(analysis.risk_factors)) {
      throw new Error("Observations or risk factors must be formatted as lists.");
    }

    if (!Array.isArray(analysis.recommendations)) {
      throw new Error("Recommendations must be returned as an array.");
    }

    const validTypes = ["disease", "irrigation", "soil", "weather", "general"];
    for (const rec of analysis.recommendations) {
      if (!validTypes.includes(rec.type)) {
        throw new Error(`Invalid recommendation type: ${rec.type}`);
      }
      if (!validPriorities.includes(rec.priority)) {
        throw new Error(`Invalid recommendation priority: ${rec.priority}`);
      }
      if (typeof rec.title !== "string" || !rec.title.trim() || typeof rec.description !== "string" || !rec.description.trim()) {
        throw new Error("Recommendation title and description must be non-empty strings.");
      }
      if (typeof rec.confidence !== "number" || isNaN(rec.confidence) || rec.confidence < 0 || rec.confidence > 100) {
        throw new Error("Individual recommendation confidence score is out of bounds.");
      }
      if (!Array.isArray(rec.actions)) {
        throw new Error("Recommendation actions must be an array of string items.");
      }
    }

    return analysis;
  } catch (error: any) {
    console.error("Gemini Recommendations Engine Error:", error);
    throw new Error("Unable to generate agricultural recommendations at this time.");
  }
}
