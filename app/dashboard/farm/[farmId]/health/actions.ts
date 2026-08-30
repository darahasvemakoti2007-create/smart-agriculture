"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface HealthFarm {
  id: string;
  farm_name: string;
  area: number | null;
  soil_type: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface HealthCrop {
  id: string;
  crop_name: string;
  variety: string | null;
  status: string;
  planting_date: string | null;
  expected_harvest_date: string | null;
}

export interface HealthSoil {
  id: string;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
  recorded_at: string;
}

export interface HealthWeather {
  id: string;
  temperature: number | null;
  humidity: number | null;
  rain_probability: number | null;
  wind_speed: number | null;
  weather_condition: string | null;
  forecast_date: string | null;
  created_at: string;
}

export interface HealthAlert {
  id: string;
  crop_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
}

export interface HealthDisease {
  id: string;
  crop_id: string;
  disease_name: string;
  confidence: number | null;
  severity: string | null;
  symptoms: any;
  created_at: string;
}

export interface HealthRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string | null;
  source: string | null;
  confidence: number | null;
  created_at: string;
}

export interface FarmHealthContext {
  farm: HealthFarm;
  crops: HealthCrop[];
  soilReadings: HealthSoil[];
  weatherRecords: HealthWeather[];
  alerts: HealthAlert[];
  diseaseAnalyses: HealthDisease[];
  recommendations: HealthRecommendation[];
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gather the complete unified context data for Farm Health Analysis
 */
export async function getFarmHealthContext(
  farmId: string
): Promise<{ success: boolean; data?: FarmHealthContext; error?: string }> {
  if (!farmId || !uuidRegex.test(farmId)) {
    return { success: false, error: "Invalid farm identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // 1. Verify farm ownership & retrieve details
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id, farm_name, area, soil_type, location, latitude, longitude")
      .eq("id", farmId)
      .eq("user_id", user.id)
      .single();

    if (farmError || !farm) {
      return { success: false, error: "Farm not found or access denied." };
    }

    const farmData: HealthFarm = {
      id: farm.id,
      farm_name: farm.farm_name,
      area: farm.area ? Number(farm.area) : null,
      soil_type: farm.soil_type,
      location: farm.location,
      latitude: farm.latitude ? Number(farm.latitude) : null,
      longitude: farm.longitude ? Number(farm.longitude) : null,
    };

    // 2. Retrieve crops belonging to the farm
    const { data: cropsData, error: cropsError } = await supabase
      .from("crops")
      .select("id, crop_name, variety, status, planting_date, expected_harvest_date")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("planting_date", { ascending: false });

    if (cropsError) {
      console.error("Error gathering crops history for health analysis:", cropsError.message);
    }

    const cropsList: HealthCrop[] = (cropsData || []).map((c) => ({
      id: c.id,
      crop_name: c.crop_name,
      variety: c.variety,
      status: c.status || "active",
      planting_date: c.planting_date,
      expected_harvest_date: c.expected_harvest_date,
    }));

    // 3. Retrieve recent soil readings
    const { data: soilData, error: soilError } = await supabase
      .from("soil_readings")
      .select("id, nitrogen, phosphorus, potassium, ph, moisture, temperature, organic_carbon, recorded_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);

    if (soilError) {
      console.error("Error gathering soil readings for health analysis:", soilError.message);
    }

    const soilReadings: HealthSoil[] = (soilData || []).map((s) => ({
      id: s.id,
      nitrogen: s.nitrogen ? Number(s.nitrogen) : null,
      phosphorus: s.phosphorus ? Number(s.phosphorus) : null,
      potassium: s.potassium ? Number(s.potassium) : null,
      ph: s.ph ? Number(s.ph) : null,
      moisture: s.moisture ? Number(s.moisture) : null,
      temperature: s.temperature ? Number(s.temperature) : null,
      organic_carbon: s.organic_carbon ? Number(s.organic_carbon) : null,
      recorded_at: s.recorded_at,
    }));

    // 4. Retrieve recent weather records
    const { data: weatherData, error: weatherError } = await supabase
      .from("weather_records")
      .select("id, temperature, humidity, rain_probability, wind_speed, weather_condition, forecast_date, created_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (weatherError) {
      console.error("Error gathering weather records for health analysis:", weatherError.message);
    }

    const weatherRecords: HealthWeather[] = (weatherData || []).map((w) => ({
      id: w.id,
      temperature: w.temperature ? Number(w.temperature) : null,
      humidity: w.humidity ? Number(w.humidity) : null,
      rain_probability: w.rain_probability ? Number(w.rain_probability) : null,
      wind_speed: w.wind_speed ? Number(w.wind_speed) : null,
      weather_condition: w.weather_condition,
      forecast_date: w.forecast_date,
      created_at: w.created_at,
    }));

    // 5. Retrieve active/recent alerts
    const { data: alertsData, error: alertsError } = await supabase
      .from("alerts")
      .select("id, crop_id, alert_type, severity, title, message, created_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error("Error gathering alerts context for health analysis:", alertsError.message);
    }

    const alertsList: HealthAlert[] = (alertsData || []).map((a) => ({
      id: a.id,
      crop_id: a.crop_id,
      alert_type: a.alert_type,
      severity: a.severity || "low",
      title: a.title,
      message: a.message,
      created_at: a.created_at,
    }));

    // 6. Retrieve crop disease analyses
    let diseaseAnalysesList: HealthDisease[] = [];
    if (cropsList.length > 0) {
      const cropIds = cropsList.map((c) => c.id);
      const { data: diseasesData, error: diseasesError } = await supabase
        .from("disease_analyses")
        .select("id, crop_id, disease_name, confidence, severity, symptoms, created_at")
        .in("crop_id", cropIds)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (diseasesError) {
        console.error("Error gathering disease analyses for health analysis:", diseasesError.message);
      }

      diseaseAnalysesList = (diseasesData || []).map((d) => ({
        id: d.id,
        crop_id: d.crop_id,
        disease_name: d.disease_name,
        confidence: d.confidence ? Number(d.confidence) : null,
        severity: d.severity,
        symptoms: d.symptoms,
        created_at: d.created_at,
      }));
    }

    // 7. Retrieve existing recommendations
    const { data: recsData, error: recsError } = await supabase
      .from("recommendations")
      .select("id, type, title, description, priority, source, confidence, created_at")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recsError) {
      console.error("Error gathering recommendations context for health analysis:", recsError.message);
    }

    const recommendationsList: HealthRecommendation[] = (recsData || []).map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      priority: r.priority,
      source: r.source,
      confidence: r.confidence ? Number(r.confidence) : null,
      created_at: r.created_at,
    }));

    return {
      success: true,
      data: {
        farm: farmData,
        crops: cropsList,
        soilReadings: soilReadings,
        weatherRecords: weatherRecords,
        alerts: alertsList,
        diseaseAnalyses: diseaseAnalysesList,
        recommendations: recommendationsList,
      },
    };
  } catch (err) {
    console.error("Unexpected error loading farm health data context:", err);
    return { success: false, error: "Unable to load farm health data." };
  }
}
