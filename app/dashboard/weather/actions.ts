"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getCurrentWeather, getSevenDayForecast, WeatherData, DailyForecastItem } from "@/src/lib/weather";

export async function getFarmWeather(farmId: string): Promise<{ 
  data?: WeatherData; 
  forecast?: DailyForecastItem[]; 
  error?: string; 
  saveMessage?: string 
}> {
  // Validate farm ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to fetch weather data." };
  }

  // Verify farm ownership and fetch coordinates
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, latitude, longitude")
    .eq("id", farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or you do not have permission to access it." };
  }

  // Check for GPS coordinates
  if (farm.latitude === null || farm.longitude === null) {
    return { error: "GPS coordinates are not available for this farm. Please update the farm location." };
  }

  try {
    // Call the server-side weather utilities
    const weatherData = await getCurrentWeather(farm.latitude, farm.longitude);
    const forecast = await getSevenDayForecast(farm.latitude, farm.longitude);

    // Prevent duplicates: Check if we already inserted weather for this farm in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentWeather } = await supabase
      .from("weather_records")
      .select("id")
      .eq("farm_id", farmId)
      .gte("created_at", oneHourAgo.toISOString())
      .limit(1)
      .maybeSingle();

    let saveMessage = undefined;

    if (!recentWeather) {
      // Insert into weather_records using server-derived user.id
      const { error: insertError } = await supabase.from("weather_records").insert({
        farm_id: farmId,
        user_id: user.id,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rain_probability: weatherData.rainProbability,
        wind_speed: weatherData.windSpeed,
        weather_condition: weatherData.weatherCondition,
        forecast_date: new Date().toISOString().split("T")[0],
        raw_response: weatherData.rawResponse,
      });

      if (insertError) {
        console.error("Supabase Insert Error:", insertError.message);
        return { 
          data: weatherData,
          forecast,
          error: "Weather was fetched but could not be saved." 
        };
      }
      
      saveMessage = "Weather data saved";
    }

    // Weather Alerts Trigger Check
    try {
      const checkAndInsertWeatherAlert = async (title: string, message: string) => {
        try {
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);

          const { data: existing } = await supabase
            .from("alerts")
            .select("id")
            .eq("user_id", user.id)
            .eq("farm_id", farmId)
            .eq("alert_type", "weather")
            .eq("severity", "high")
            .eq("title", title)
            .eq("is_read", false)
            .gte("created_at", oneHourAgo.toISOString())
            .limit(1)
            .maybeSingle();

          if (!existing) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 6); // weather alerts expire in 6 hours

            await supabase.from("alerts").insert({
              farm_id: farmId,
              crop_id: null,
              user_id: user.id,
              alert_type: "weather",
              severity: "high",
              title: title,
              message,
              expires_at: expiresAt.toISOString(),
            });
          }
        } catch (dbErr) {
          console.error(`Failed to execute query for weather alert "${title}":`, dbErr);
        }
      };

      if (weatherData.rainProbability !== null && weatherData.rainProbability > 85) {
        await checkAndInsertWeatherAlert(
          "Heavy Rain Warning",
          `Heavy rain is forecast with a ${weatherData.rainProbability}% probability. Review drainage and crop protection.`
        );
      }
      if (weatherData.temperature !== null && weatherData.temperature < 5) {
        await checkAndInsertWeatherAlert(
          "Low Temperature Warning",
          `Low temperature alert: forecast is ${weatherData.temperature}°C. Review frost mitigation strategies.`
        );
      }
      if (weatherData.windSpeed !== null && weatherData.windSpeed > 30) {
        await checkAndInsertWeatherAlert(
          "High Wind Warning",
          `High wind alert: forecast speed is ${weatherData.windSpeed} m/s. Secure crop covers and structures.`
        );
      }

      const { revalidatePath } = await import("next/cache");
      revalidatePath("/dashboard/weather");
      revalidatePath("/dashboard");
    } catch (alertError) {
      console.error("Failed to automatically generate weather alert warnings:", alertError);
    }

    return { data: weatherData, forecast, saveMessage };
  } catch (err: any) {
    console.error("Weather API Action Error:", err);
    return { error: err.message || "Failed to fetch weather data from the external service." };
  }
}

export interface WeatherRecord {
  id: string;
  temperature: number;
  humidity: number;
  rain_probability: number;
  wind_speed: number;
  weather_condition: string;
  forecast_date: string;
  created_at: string;
}

export async function getWeatherHistory(farmId: string): Promise<{ data?: WeatherRecord[]; error?: string }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to view weather history." };
  }

  const { data: records, error } = await supabase
    .from("weather_records")
    .select("id, temperature, humidity, rain_probability, wind_speed, weather_condition, forecast_date, created_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching weather history:", error.message);
    return { error: "Failed to load weather history." };
  }

  return { data: records as WeatherRecord[] };
}
