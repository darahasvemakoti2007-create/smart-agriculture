"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getGeminiClient } from "@/src/lib/gemini";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function chatWithFarmAI(
  userMessage: string,
  history: ChatMessage[]
): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // 2. Fetch all user farms
    const { data: farms, error: farmsError } = await supabase
      .from("farms")
      .select("id, farm_name, location, area, soil_type, irrigation_type, latitude, longitude")
      .eq("user_id", user.id);

    if (farmsError) {
      console.error("Error fetching farms for chat:", farmsError.message);
    }

    const farmIds = (farms || []).map((f) => f.id);

    let crops: any[] = [];
    let soilReadings: any[] = [];
    let weatherRecords: any[] = [];
    let alerts: any[] = [];
    let diseaseAnalyses: any[] = [];
    let recommendations: any[] = [];

    if (farmIds.length > 0) {
      // 3. Fetch crops for these farms
      const { data: cropsData } = await supabase
        .from("crops")
        .select("id, farm_id, crop_name, variety, status, planting_date, expected_harvest_date")
        .in("farm_id", farmIds);
      crops = cropsData || [];

      const cropIds = crops.map((c) => c.id);

      // 4. Fetch latest soil readings (limit 15)
      const { data: soilData } = await supabase
        .from("soil_readings")
        .select("farm_id, ph, nitrogen, phosphorus, potassium, moisture, temperature, organic_carbon, recorded_at")
        .in("farm_id", farmIds)
        .order("recorded_at", { ascending: false })
        .limit(15);
      soilReadings = soilData || [];

      // 5. Fetch latest weather records (limit 10)
      const { data: weatherData } = await supabase
        .from("weather_records")
        .select("farm_id, temperature, humidity, rain_probability, wind_speed, weather_condition, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
        .limit(10);
      weatherRecords = weatherData || [];

      // 6. Fetch active alerts
      const { data: alertsData } = await supabase
        .from("alerts")
        .select("farm_id, alert_type, severity, title, message, created_at")
        .in("farm_id", farmIds)
        .eq("is_read", false);
      alerts = alertsData || [];

      // 7. Fetch disease analyses for these crops (limit 15)
      if (cropIds.length > 0) {
        const { data: diseaseData } = await supabase
          .from("disease_analyses")
          .select("crop_id, disease_name, confidence, severity, symptoms, created_at")
          .in("crop_id", cropIds)
          .order("created_at", { ascending: false })
          .limit(15);
        diseaseAnalyses = diseaseData || [];
      }

      // 8. Fetch recommendations (limit 10)
      const { data: recsData } = await supabase
        .from("recommendations")
        .select("farm_id, type, title, description, priority, confidence, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
        .limit(10);
      recommendations = recsData || [];
    }

    // 9. Format agricultural context
    const context = {
      farms: (farms || []).map(f => ({
        farm_name: f.farm_name,
        location: f.location,
        area: f.area,
        soil_type: f.soil_type,
        irrigation_type: f.irrigation_type,
      })),
      crops: crops.map(c => ({
        crop_name: c.crop_name,
        variety: c.variety,
        status: c.status,
        planted: c.planting_date,
      })),
      latestSoilReadings: soilReadings.slice(0, 3).map(s => ({
        nitrogen: s.nitrogen,
        phosphorus: s.phosphorus,
        potassium: s.potassium,
        ph: s.ph,
        moisture: s.moisture,
        temperature: s.temperature,
        recorded_at: s.recorded_at,
      })),
      latestWeatherRecords: weatherRecords.slice(0, 2).map(w => ({
        temp: w.temperature,
        humidity: w.humidity,
        rain: w.rain_probability,
        wind: w.wind_speed,
        condition: w.weather_condition,
      })),
      activeAlerts: alerts.map(a => ({
        type: a.alert_type,
        severity: a.severity,
        title: a.title,
        message: a.message,
      })),
      recentDiseases: diseaseAnalyses.slice(0, 3).map(d => ({
        disease: d.disease_name,
        confidence: d.confidence,
        severity: d.severity,
        symptoms: d.symptoms,
      })),
      recentRecommendations: recommendations.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title,
        description: r.description,
      })),
    };

    // 10. Query Gemini
    const client = getGeminiClient();
    const systemInstruction = `
You are AgriBot, the highly intelligent AI agricultural decision-support chatbot for the AgriSync platform.
Your purpose is to answer the farmer's questions based on their real-time farm context.

Here is the farmer's aggregated farm context:
${JSON.stringify(context, null, 2)}

CRITICAL ADVISORY RULES:
1. Base your answers ONLY on the supplied farm context. Never claim that you physically measured weather conditions, soil moisture, or visited the farm yourself.
2. If metrics (such as NPK, weather, or crop status) are empty or not present in the context, explicitly inform the farmer that "This data is not currently logged" instead of fabricating values.
3. Suggest logging readings via the "Soil Health" page or uploading a crop leaf image via the "Disease Detection" tab if data is missing.
4. Keep advice farmer-friendly, concise, practical, and highly focused on sustainable organic farming.
5. NEVER suggest hazardous pesticide combinations, illegal chemical dosages, or toxic mixtures. Favor standard, safe bio-control agents, crop rotation, and composting.
6. If the data indicates a critical danger (e.g. disease severity = critical or high-risk frost weather), advise immediate inspection and professional local agronomic verification.
7. Reply in plain, well-structured Markdown text. Keep paragraphs short and easy to read on mobile. Do not output JSON.
8. MULTILINGUAL & REGIONAL LANGUAGE RULE: You possess full native fluency in all Indian and global languages (English, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, etc.). ALWAYS identify the language and script used in the farmer's prompt and REPLY IN THE EXACT SAME LANGUAGE AND SCRIPT. If the farmer asks a question in Telugu, reply in clear Telugu. If they ask in Hindi, reply in Hindi. If they use Hinglish or Teluglish, respond in their native language script so it is completely natural for them to understand.
`;

    // Map history to standard chat structure
    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        temperature: 0.7,
      }
    });

    if (!result.text) {
      throw new Error("No response text returned from AI client.");
    }

    return { success: true, reply: result.text };
  } catch (error: any) {
    console.error("AgriBot Chat Error:", error);
    return {
      success: false,
      error: "Unable to connect to AgriBot right now. Please try again later."
    };
  }
}
