"use server";

import { createClient } from "@/src/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export interface CategoryScore {
  name: string;
  score: number; // 0–100
  icon: string;
  status: "excellent" | "good" | "warning" | "critical";
  detail: string;
}

export interface FarmHealthResult {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: CategoryScore[];
  aiActions: string[];
  farmName: string;
  lastUpdated: string;
}

function scoreStatus(score: number): "excellent" | "good" | "warning" | "critical" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

function gradeFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export async function computeFarmHealthScore(): Promise<{
  data?: FarmHealthResult;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // ── Fetch latest farm ──
  const { data: farms } = await supabase
    .from("farms")
    .select("id, farm_name, soil_type")
    .order("created_at", { ascending: false })
    .limit(1);

  const farm = farms?.[0];
  const farmName = farm?.farm_name || "Your Farm";

  // ── Fetch latest soil reading ──
  const { data: soilData } = await supabase
    .from("soil_readings")
    .select("ph, nitrogen, phosphorus, potassium, moisture")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Fetch latest weather ──
  const { data: weatherData } = await supabase
    .from("weather_forecasts")
    .select("temperature, humidity, rain_probability, wind_speed, weather_condition")
    .order("forecast_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Fetch recent disease detections ──
  const { data: diseases } = await supabase
    .from("disease_detections")
    .select("disease_name, severity, confidence_score, detected_at")
    .order("detected_at", { ascending: false })
    .limit(5);

  // ── Fetch unread alerts ──
  const { count: unreadAlerts } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // ── Fetch active crops ──
  const { count: activeCrops } = await supabase
    .from("crops")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // ── Score: Soil Health (0–100) ──
  let soilScore = 50; // default if no data
  let soilDetail = "No soil data recorded yet";
  if (soilData) {
    let s = 100;
    const ph = soilData.ph;
    if (ph !== null) {
      // ideal pH 6–7.5
      if (ph < 5 || ph > 9) s -= 30;
      else if (ph < 5.5 || ph > 8) s -= 15;
      else if (ph < 6 || ph > 7.5) s -= 5;
    }
    const moisture = soilData.moisture;
    if (moisture !== null) {
      if (moisture < 20 || moisture > 85) s -= 20;
      else if (moisture < 30 || moisture > 75) s -= 10;
    }
    const n = soilData.nitrogen;
    if (n !== null && n < 10) s -= 15;
    soilScore = Math.max(0, Math.min(100, s));
    soilDetail = `pH ${ph?.toFixed(1) ?? "—"} · Moisture ${moisture?.toFixed(0) ?? "—"}% · N ${n?.toFixed(0) ?? "—"}`;
  }

  // ── Score: Disease Risk (0–100, higher = healthier) ──
  let diseaseScore = 90;
  let diseaseDetail = "No recent disease detections";
  if (diseases && diseases.length > 0) {
    const recent = diseases[0];
    const sev = (recent.severity || "").toLowerCase();
    if (sev === "critical" || sev === "high") diseaseScore = 20;
    else if (sev === "medium" || sev === "moderate") diseaseScore = 55;
    else diseaseScore = 75;
    diseaseDetail = `Latest: ${recent.disease_name || "Unknown"} (${sev})`;
  }

  // ── Score: Weather Suitability (0–100) ──
  let weatherScore = 70;
  let weatherDetail = "No weather data available";
  if (weatherData) {
    let ws = 100;
    const rain = weatherData.rain_probability;
    const wind = weatherData.wind_speed;
    const temp = weatherData.temperature;
    if (rain !== null && rain > 80) ws -= 20;
    if (wind !== null && wind > 40) ws -= 25;
    if (temp !== null && (temp > 42 || temp < 5)) ws -= 30;
    weatherScore = Math.max(0, Math.min(100, ws));
    weatherDetail = `${weatherData.weather_condition || "Clear"} · Rain ${rain?.toFixed(0) ?? "—"}% · ${temp?.toFixed(0) ?? "—"}°C`;
  }

  // ── Score: Farm Activity (0–100) ──
  let activityScore = 50;
  let activityDetail = "Register crops and log data to improve this score";
  if ((activeCrops ?? 0) > 0) {
    activityScore += 30;
    activityDetail = `${activeCrops} active crop(s)`;
  }
  if ((unreadAlerts ?? 0) === 0) {
    activityScore += 20;
    activityDetail += " · No unread alerts";
  } else {
    activityScore -= Math.min(30, (unreadAlerts ?? 0) * 5);
    activityDetail += ` · ${unreadAlerts} unread alert(s)`;
  }
  activityScore = Math.max(0, Math.min(100, activityScore));

  // ── Overall score ──
  const overallScore = Math.round(
    soilScore * 0.35 + diseaseScore * 0.30 + weatherScore * 0.20 + activityScore * 0.15
  );

  const categories: CategoryScore[] = [
    { name: "Soil Health", score: soilScore, icon: "🪨", status: scoreStatus(soilScore), detail: soilDetail },
    { name: "Disease Risk", score: diseaseScore, icon: "🔬", status: scoreStatus(diseaseScore), detail: diseaseDetail },
    { name: "Weather Suitability", score: weatherScore, icon: "🌦", status: scoreStatus(weatherScore), detail: weatherDetail },
    { name: "Farm Activity", score: activityScore, icon: "🌱", status: scoreStatus(activityScore), detail: activityDetail },
  ];

  // ── AI Action Plan ──
  let aiActions: string[] = [
    "Add a soil reading to enable detailed health tracking.",
    "Scan your crops for disease using the Disease Detection tool.",
    "Check your weather forecast and plan irrigation accordingly.",
  ];

  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `You are an expert agricultural advisor. Based on this farm data, give exactly 4 short, specific, actionable tips (one sentence each) for the farmer to improve their farm health score today.

Farm: ${farmName}
Overall Health Score: ${overallScore}/100
Soil: ${soilDetail}
Disease Status: ${diseaseDetail}
Weather: ${weatherDetail}
Activity: ${activityDetail}

Return ONLY a JSON array of 4 strings, no other text. Example: ["Tip 1.", "Tip 2.", "Tip 3.", "Tip 4."]`;

    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        aiActions = parsed.slice(0, 4);
      }
    }
  } catch {
    // Keep default actions if AI fails
  }

  return {
    data: {
      overallScore,
      grade: gradeFromScore(overallScore),
      categories,
      aiActions,
      farmName,
      lastUpdated: new Date().toLocaleString("en-IN"),
    },
  };
}
