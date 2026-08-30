import "server-only";
import { getGeminiClient } from "@/src/lib/gemini";
import { Schema, Type } from "@google/genai";

export interface FarmHealthInput {
  farm: {
    id: string;
    farm_name: string;
    area: number | null;
    location: string | null;
    soil_type: string | null;
    latitude: number | null;
    longitude: number | null;
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
  weatherRecords: Array<{
    temperature: number | null;
    humidity: number | null;
    moisture?: number | null;
    rain_probability: number | null;
    wind_speed: number | null;
    weather_condition?: string | null;
    recorded_at?: string | null;
    created_at?: string;
  }>;
  alerts: Array<{
    id: string;
    crop_id: string | null;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    created_at: string;
  }>;
  diseaseAnalyses: Array<{
    crop_id: string;
    disease_name: string;
    confidence: number | null;
    severity: string | null;
    symptoms: any;
    created_at: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string | null;
    confidence: number | null;
    created_at: string;
  }>;
}

export interface SoilAssessment {
  status: "low" | "adequate" | "high" | "unknown";
  nitrogen_status: "low" | "adequate" | "high" | "unknown";
  phosphorus_status: "low" | "adequate" | "high" | "unknown";
  potassium_status: "low" | "adequate" | "high" | "unknown";
  ph_status: "acidic" | "optimal" | "alkaline" | "unknown";
  moisture_status: "low" | "adequate" | "high" | "unknown";
  observations: string[];
}

export interface WeatherAssessment {
  status: "stable" | "watch" | "risky" | "unknown";
  risk_level: "low" | "moderate" | "high" | "critical" | "unknown";
  observations: string[];
  concerns: string[];
}

export interface CropHealthAssessment {
  status: "healthy" | "watch" | "at_risk" | "critical" | "unknown";
  affected_crop_count: number;
  disease_risk: "low" | "moderate" | "high" | "critical" | "unknown";
  observations: string[];
}

export interface AlertAssessment {
  status: "healthy" | "watch" | "critical" | "unknown";
  active_alert_count: number;
  highest_severity: "low" | "moderate" | "high" | "critical" | "unknown";
  observations: string[];
}

export interface PriorityActionItem {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "soil" | "weather" | "crop" | "disease" | "alert" | "general";
}

export interface SustainabilityActionItem {
  title: string;
  description: string;
}

export interface FarmHealthReport {
  overall_status: "healthy" | "watch" | "at_risk" | "critical" | "insufficient_data";
  health_score: number;
  overall_risk: "low" | "moderate" | "high" | "critical" | "unknown";
  confidence: number;
  summary: string;
  soil_assessment: SoilAssessment;
  weather_assessment: WeatherAssessment;
  crop_health_assessment: CropHealthAssessment;
  alert_assessment: AlertAssessment;
  priority_actions: PriorityActionItem[];
  sustainability_actions: SustainabilityActionItem[];
  safety_warnings: string[];
  strengths: string[];
  areas_of_concern: string[];
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_status: {
      type: Type.STRING,
      enum: ["healthy", "watch", "at_risk", "critical", "insufficient_data"],
    },
    health_score: { type: Type.INTEGER },
    overall_risk: {
      type: Type.STRING,
      enum: ["low", "moderate", "high", "critical", "unknown"],
    },
    confidence: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    soil_assessment: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        nitrogen_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        phosphorus_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        potassium_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        ph_status: { type: Type.STRING, enum: ["acidic", "optimal", "alkaline", "unknown"] },
        moisture_status: { type: Type.STRING, enum: ["low", "adequate", "high", "unknown"] },
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        "status",
        "nitrogen_status",
        "phosphorus_status",
        "potassium_status",
        "ph_status",
        "moisture_status",
        "observations",
      ],
    },
    weather_assessment: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["stable", "watch", "risky", "unknown"] },
        risk_level: { type: Type.STRING, enum: ["low", "moderate", "high", "critical", "unknown"] },
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
        concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["status", "risk_level", "observations", "concerns"],
    },
    crop_health_assessment: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["healthy", "watch", "at_risk", "critical", "unknown"] },
        affected_crop_count: { type: Type.INTEGER },
        disease_risk: { type: Type.STRING, enum: ["low", "moderate", "high", "critical", "unknown"] },
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["status", "affected_crop_count", "disease_risk", "observations"],
    },
    alert_assessment: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["healthy", "watch", "critical", "unknown"] },
        active_alert_count: { type: Type.INTEGER },
        highest_severity: { type: Type.STRING, enum: ["low", "moderate", "high", "critical", "unknown"] },
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["status", "active_alert_count", "highest_severity", "observations"],
    },
    priority_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          category: { type: Type.STRING, enum: ["soil", "weather", "crop", "disease", "alert", "general"] },
        },
        required: ["title", "description", "priority", "category"],
      },
    },
    sustainability_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "description"],
      },
    },
    safety_warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    areas_of_concern: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "overall_status",
    "health_score",
    "overall_risk",
    "confidence",
    "summary",
    "soil_assessment",
    "weather_assessment",
    "crop_health_assessment",
    "alert_assessment",
    "priority_actions",
    "sustainability_actions",
    "safety_warnings",
    "strengths",
    "areas_of_concern",
  ],
};

/**
 * Execute dynamic consolidated farm health analysis
 */
export async function generateFarmHealthAnalysis(
  input: FarmHealthInput
): Promise<FarmHealthReport> {
  const client = getGeminiClient();

  const formatVal = (val: any, unit: string = "") => {
    return val !== null && val !== undefined ? `${val}${unit}` : "Not available";
  };

  // Serialize inputs
  const cropsText =
    input.crops.length === 0
      ? "No crops registered."
      : input.crops
          .map(
            (c) =>
              `- Crop Name: ${c.crop_name} ${c.variety ? `(${c.variety})` : ""}, Status: ${c.status}, Planted: ${formatVal(c.planting_date)}, Harvested: ${formatVal(c.expected_harvest_date)}`
          )
          .join("\n");

  const soilText =
    input.soilReadings.length === 0
      ? "No soil logs registered."
      : input.soilReadings
          .slice(0, 5)
          .map(
            (s, idx) =>
              `Readings Log #${idx + 1} (${s.recorded_at}):
  - Nitrogen (N): ${formatVal(s.nitrogen, " mg/kg")}
  - Phosphorus (P): ${formatVal(s.phosphorus, " mg/kg")}
  - Potassium (K): ${formatVal(s.potassium, " mg/kg")}
  - pH Level: ${formatVal(s.ph)}
  - Moisture: ${formatVal(s.moisture, "%")}
  - Temperature: ${formatVal(s.temperature, "°C")}
  - Organic Carbon: ${formatVal(s.organic_carbon, "%")}`
          )
          .join("\n\n");

  const weatherText =
    input.weatherRecords.length === 0
      ? "No recent weather logs recorded."
      : input.weatherRecords
          .slice(0, 5)
          .map(
            (w, idx) =>
              `Weather Log #${idx + 1} (${formatVal(w.recorded_at || w.created_at || null)}):
  - Temperature: ${formatVal(w.temperature, "°C")}
  - Humidity: ${formatVal(w.humidity, "%")}
  - Moisture: ${formatVal(w.moisture, "%")}
  - Rain Probability: ${formatVal(w.rain_probability, "%")}
  - Wind Speed: ${formatVal(w.wind_speed, " km/h")}
  - Condition: ${w.weather_condition || "Unknown"}`
          )
          .join("\n\n");

  const alertsText =
    input.alerts.length === 0
      ? "No active alerts registered."
      : input.alerts
          .map(
            (a) =>
              `- Type: ${a.alert_type}, Severity: ${a.severity}, Title: ${a.title}, Message: ${a.message}, Created: ${a.created_at}`
          )
          .join("\n");

  const diseaseText =
    input.diseaseAnalyses.length === 0
      ? "No disease analysis history registered."
      : input.diseaseAnalyses
          .map(
            (d) =>
              `- Disease: ${d.disease_name}, Confidence: ${formatVal(d.confidence, "%")}, Severity: ${d.severity || "unknown"}, Symptoms: ${d.symptoms ? JSON.stringify(d.symptoms) : "None"}`
          )
          .join("\n");

  const recsText =
    input.recommendations.length === 0
      ? "No recommendation logs registered."
      : input.recommendations
          .slice(0, 5)
          .map(
            (r) =>
              `- Type: ${r.type}, Title: ${r.title}, Priority: ${r.priority || "medium"}, Confidence: ${formatVal(r.confidence, "%")}`
          )
          .join("\n");

  const prompt = `
You are an agricultural decision-support assistant.
Analyze the following farm metadata, soil telemetry, recent weather condition logs, active alerts warnings, crop pathology disease analyses, and historical recommendations to prepare a Consolidated Farm Health & Risk Report.

FARM DETAILS:
- Name: ${input.farm.farm_name}
- Area: ${formatVal(input.farm.area, " acres")}
- Location: ${input.farm.location || "Unknown"}
- Soil Type: ${input.farm.soil_type || "Unknown"}

CULTIVATION RECORDED CROPS:
${cropsText}

RECENT SOIL HEALTH TELEMETRY:
${soilText}

RECENT METEOROLOGICAL WEATHER RECORDS:
${weatherText}

ACTIVE ALERTS:
${alertsText}

CROP PATHOLOGY DISEASE DIAGNOSES:
${diseaseText}

PREVIOUS AI RECOMMENDATIONS:
${recsText}

CRITICAL RULES:
1. Analyze ONLY the supplied farm context. Never claim that you physically measured weather conditions or soil moisture yourself.
2. If some measurements are marked as "Not available" or missing, distinguish observations from recommendations. Do NOT fabricate missing measurements (NPK, weather, disease counts, alert severity, crop conditions, soil measurements).
3. Generate a farm health score from 0 to 100 based on NPK balance, soil pH stability, active diseases, weather risk, and alert severity. Do not claim this is a scientific or official certification; it is an AI decision-support score.
4. If critical datasets are missing (such as no soil logs or crops), reduce AI confidence and set overall_status = "insufficient_data" and overall_risk = "unknown", and explain which information is missing in the summary.
5. Provide practical, farmer-friendly recommendations and actions, but do NOT prescribe hazardous pesticides, toxic chemical recipes, or unsafe chemical mixtures. If the data indicates a potentially serious agricultural issue, recommend professional/local agricultural expert verification where appropriate.
6. Identify uncertainty and prioritize critical risks.
7. Return a valid structured JSON object adhering exactly to the schema.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.15,
      },
    });

    if (!result.text) {
      throw new Error("Empty response from Gemini.");
    }

    const rawReport = JSON.parse(result.text);
    
    // Normalize response safely
    const normalizedReport = normalizeReport(rawReport);

    // Validate structured response enums and boundaries strictly
    validateReport(normalizedReport);

    return normalizedReport;
  } catch (error: any) {
    console.error("Gemini Farm Health Analyzer Engine Error:", error);
    throw new Error("Unable to generate farm health analysis at this time.");
  }
}

function normalizeReport(r: any): FarmHealthReport {
  if (!r || typeof r !== "object") {
    throw new Error("Invalid response object format");
  }

  // Helper for status validation and fallback
  const pickEnum = <T extends string>(val: any, allowed: T[], fallback: T): T => {
    if (typeof val === "string") {
      const sanitized = val.toLowerCase().trim();
      if (allowed.includes(sanitized as T)) {
        return sanitized as T;
      }
    }
    return fallback;
  };

  const normalizeNumber = (val: any, min: number, max: number, fallback: number): number => {
    const num = Number(val);
    if (isNaN(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  };

  const normalizeArray = (val: any): string[] => {
    if (Array.isArray(val)) {
      return val.filter(item => typeof item === "string");
    }
    return [];
  };

  const overall_status = pickEnum(
    r.overall_status,
    ["healthy", "watch", "at_risk", "critical", "insufficient_data"],
    "insufficient_data"
  );

  const overall_risk = pickEnum(
    r.overall_risk,
    ["low", "moderate", "high", "critical", "unknown"],
    "unknown"
  );

  const health_score = normalizeNumber(r.health_score, 0, 100, 50);
  const confidence = normalizeNumber(r.confidence, 0, 100, 50);
  const summary = typeof r.summary === "string" ? r.summary : "No summary available.";

  // Soil assessment
  const soilRaw = r.soil_assessment || {};
  const soil_assessment: SoilAssessment = {
    status: pickEnum(soilRaw.status, ["low", "adequate", "high", "unknown"], "unknown"),
    nitrogen_status: pickEnum(soilRaw.nitrogen_status, ["low", "adequate", "high", "unknown"], "unknown"),
    phosphorus_status: pickEnum(soilRaw.phosphorus_status, ["low", "adequate", "high", "unknown"], "unknown"),
    potassium_status: pickEnum(soilRaw.potassium_status, ["low", "adequate", "high", "unknown"], "unknown"),
    ph_status: pickEnum(soilRaw.ph_status, ["acidic", "optimal", "alkaline", "unknown"], "unknown"),
    moisture_status: pickEnum(soilRaw.moisture_status, ["low", "adequate", "high", "unknown"], "unknown"),
    observations: normalizeArray(soilRaw.observations),
  };

  // Weather assessment
  const weatherRaw = r.weather_assessment || {};
  const weather_assessment: WeatherAssessment = {
    status: pickEnum(weatherRaw.status, ["stable", "watch", "risky", "unknown"], "unknown"),
    risk_level: pickEnum(weatherRaw.risk_level, ["low", "moderate", "high", "critical", "unknown"], "unknown"),
    observations: normalizeArray(weatherRaw.observations),
    concerns: normalizeArray(weatherRaw.concerns),
  };

  // Crop health assessment
  const cropRaw = r.crop_health_assessment || {};
  const crop_health_assessment: CropHealthAssessment = {
    status: pickEnum(cropRaw.status, ["healthy", "watch", "at_risk", "critical", "unknown"], "unknown"),
    affected_crop_count: typeof cropRaw.affected_crop_count === "number" ? Math.max(0, cropRaw.affected_crop_count) : 0,
    disease_risk: pickEnum(cropRaw.disease_risk, ["low", "moderate", "high", "critical", "unknown"], "unknown"),
    observations: normalizeArray(cropRaw.observations),
  };

  // Alert assessment
  const alertRaw = r.alert_assessment || {};
  const alert_assessment: AlertAssessment = {
    status: pickEnum(alertRaw.status, ["healthy", "watch", "critical", "unknown"], "unknown"),
    active_alert_count: typeof alertRaw.active_alert_count === "number" ? Math.max(0, alertRaw.active_alert_count) : 0,
    highest_severity: pickEnum(alertRaw.highest_severity, ["low", "moderate", "high", "critical", "unknown"], "unknown"),
    observations: normalizeArray(alertRaw.observations),
  };

  // Priority actions
  const priority_actions: PriorityActionItem[] = [];
  if (Array.isArray(r.priority_actions)) {
    for (const item of r.priority_actions) {
      if (item && typeof item === "object") {
        priority_actions.push({
          title: typeof item.title === "string" ? item.title : "Inspect metrics",
          description: typeof item.description === "string" ? item.description : "Monitor parameters",
          priority: pickEnum(item.priority, ["low", "medium", "high", "critical"], "medium"),
          category: pickEnum(item.category, ["soil", "weather", "crop", "disease", "alert", "general"], "general"),
        });
      }
    }
  }

  // Sustainability actions
  const sustainability_actions: SustainabilityActionItem[] = [];
  if (Array.isArray(r.sustainability_actions)) {
    for (const item of r.sustainability_actions) {
      if (item && typeof item === "object") {
        sustainability_actions.push({
          title: typeof item.title === "string" ? item.title : "Crop management",
          description: typeof item.description === "string" ? item.description : "Review sustainable practices",
        });
      }
    }
  }

  const safety_warnings = normalizeArray(r.safety_warnings);
  const strengths = normalizeArray(r.strengths);
  const areas_of_concern = normalizeArray(r.areas_of_concern);

  return {
    overall_status,
    health_score,
    overall_risk,
    confidence,
    summary,
    soil_assessment,
    weather_assessment,
    crop_health_assessment,
    alert_assessment,
    priority_actions,
    sustainability_actions,
    safety_warnings,
    strengths,
    areas_of_concern,
  };
}

function validateReport(r: any): void {
  if (!r) throw new Error("Null response");

  const validStatuses = ["healthy", "watch", "at_risk", "critical", "insufficient_data"];
  if (!validStatuses.includes(r.overall_status)) {
    throw new Error(`Invalid overall status: ${r.overall_status}`);
  }

  const validRisks = ["low", "moderate", "high", "critical", "unknown"];
  if (!validRisks.includes(r.overall_risk)) {
    throw new Error(`Invalid overall risk: ${r.overall_risk}`);
  }

  if (typeof r.health_score !== "number" || r.health_score < 0 || r.health_score > 100) {
    throw new Error("Health score must be between 0 and 100");
  }

  if (typeof r.confidence !== "number" || r.confidence < 0 || r.confidence > 100) {
    throw new Error("Confidence must be between 0 and 100");
  }

  if (!r.summary || typeof r.summary !== "string") {
    throw new Error("Summary must be a non-empty string");
  }

  // Soil assessment validation
  if (!r.soil_assessment) throw new Error("Missing soil assessment");
  const validSoilStatus = ["low", "adequate", "high", "unknown"];
  const validPh = ["acidic", "optimal", "alkaline", "unknown"];

  if (!validSoilStatus.includes(r.soil_assessment.status)) throw new Error("Invalid soil status");
  if (!validSoilStatus.includes(r.soil_assessment.nitrogen_status)) throw new Error("Invalid N status");
  if (!validSoilStatus.includes(r.soil_assessment.phosphorus_status)) throw new Error("Invalid P status");
  if (!validSoilStatus.includes(r.soil_assessment.potassium_status)) throw new Error("Invalid K status");
  if (!validPh.includes(r.soil_assessment.ph_status)) throw new Error("Invalid pH status");
  if (!validSoilStatus.includes(r.soil_assessment.moisture_status)) throw new Error("Invalid soil moisture status");

  if (!Array.isArray(r.soil_assessment.observations)) throw new Error("Soil observations must be an array");

  // Weather assessment validation
  if (!r.weather_assessment) throw new Error("Missing weather assessment");
  const validWeatherStatus = ["stable", "watch", "risky", "unknown"];
  if (!validWeatherStatus.includes(r.weather_assessment.status)) throw new Error("Invalid weather status");
  if (!validRisks.includes(r.weather_assessment.risk_level)) throw new Error("Invalid weather risk level");
  if (!Array.isArray(r.weather_assessment.observations)) throw new Error("Weather observations must be an array");
  if (!Array.isArray(r.weather_assessment.concerns)) throw new Error("Weather concerns must be an array");

  // Crop assessment validation
  if (!r.crop_health_assessment) throw new Error("Missing crop assessment");
  const validCropStatus = ["healthy", "watch", "at_risk", "critical", "unknown"];
  if (!validCropStatus.includes(r.crop_health_assessment.status)) throw new Error("Invalid crop status");
  if (typeof r.crop_health_assessment.affected_crop_count !== "number") throw new Error("Affected crop count must be a number");
  if (!validRisks.includes(r.crop_health_assessment.disease_risk)) throw new Error("Invalid disease risk level");
  if (!Array.isArray(r.crop_health_assessment.observations)) throw new Error("Crop observations must be an array");

  // Alerts assessment validation
  if (!r.alert_assessment) throw new Error("Missing alert assessment");
  const validAlertStatus = ["healthy", "watch", "critical", "unknown"];
  if (!validAlertStatus.includes(r.alert_assessment.status)) throw new Error("Invalid alert status");
  if (typeof r.alert_assessment.active_alert_count !== "number") throw new Error("Active alert count must be a number");
  if (!validRisks.includes(r.alert_assessment.highest_severity)) throw new Error("Invalid alert severity");
  if (!Array.isArray(r.alert_assessment.observations)) throw new Error("Alert observations must be an array");

  // Priority actions validation
  if (!Array.isArray(r.priority_actions)) throw new Error("Priority actions must be an array");
  const validActionPriorities = ["low", "medium", "high", "critical"];
  const validActionCategories = ["soil", "weather", "crop", "disease", "alert", "general"];

  for (const item of r.priority_actions) {
    if (
      !item.title ||
      !item.description ||
      !validActionPriorities.includes(item.priority) ||
      !validActionCategories.includes(item.category)
    ) {
      throw new Error("Invalid priority action item properties");
    }
  }

  // Sustainability actions validation
  if (!Array.isArray(r.sustainability_actions)) throw new Error("Sustainability actions must be an array");
  for (const item of r.sustainability_actions) {
    if (!item.title || !item.description) {
      throw new Error("Invalid sustainability action item properties");
    }
  }

  if (!Array.isArray(r.safety_warnings)) throw new Error("Safety warnings must be an array");
  if (!Array.isArray(r.strengths)) throw new Error("Strengths must be an array");
  if (!Array.isArray(r.areas_of_concern)) throw new Error("Areas of concern must be an array");
}
