"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface SoilReadingInput {
  farmId: string;
  ph?: string;
  nitrogen?: string;
  phosphorus?: string;
  potassium?: string;
  moisture?: string;
  temperature?: string;
  organicCarbon?: string;
}

export async function createSoilReading(input: SoilReadingInput): Promise<{ success?: boolean; error?: string }> {
  // Validate farm ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!input.farmId || !uuidRegex.test(input.farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to save soil health readings." };
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id")
    .eq("id", input.farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or you do not have permission to access it." };
  }

  // Helper to parse and validate optional numeric values
  const parseAndValidate = (
    value: string | undefined,
    fieldName: string,
    min?: number,
    max?: number
  ): { val: number | null; error?: string } => {
    if (value === undefined || value.trim() === "") {
      return { val: null };
    }
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return { val: null, error: `${fieldName} must be a valid number.` };
    }
    if (min !== undefined && num < min) {
      return { val: null, error: `${fieldName} must be at least ${min}.` };
    }
    if (max !== undefined && num > max) {
      return { val: null, error: `${fieldName} must be at most ${max}.` };
    }
    return { val: num };
  };

  // Perform validation on the server side
  const phRes = parseAndValidate(input.ph, "pH", 0, 14);
  if (phRes.error) return { error: phRes.error };

  const moistureRes = parseAndValidate(input.moisture, "Moisture", 0, 100);
  if (moistureRes.error) return { error: moistureRes.error };

  const nitrogenRes = parseAndValidate(input.nitrogen, "Nitrogen");
  if (nitrogenRes.error) return { error: nitrogenRes.error };

  const phosphorusRes = parseAndValidate(input.phosphorus, "Phosphorus");
  if (phosphorusRes.error) return { error: phosphorusRes.error };

  const potassiumRes = parseAndValidate(input.potassium, "Potassium");
  if (potassiumRes.error) return { error: potassiumRes.error };

  const tempRes = parseAndValidate(input.temperature, "Temperature");
  if (tempRes.error) return { error: tempRes.error };

  const carbonRes = parseAndValidate(input.organicCarbon, "Organic Carbon", 0, 100);
  if (carbonRes.error) return { error: carbonRes.error };

  // Insert into Supabase soil_readings table
  const { error: insertError } = await supabase.from("soil_readings").insert({
    farm_id: input.farmId,
    user_id: user.id,
    ph: phRes.val,
    nitrogen: nitrogenRes.val,
    phosphorus: phosphorusRes.val,
    potassium: potassiumRes.val,
    moisture: moistureRes.val,
    temperature: tempRes.val,
    organic_carbon: carbonRes.val,
  });

  if (insertError) {
    console.error("Supabase insert error on soil reading:", insertError.message);
    return { error: "Failed to save the soil reading to the database." };
  }

  // Trigger low soil moisture warning if applicable (moisture < 20)
  if (moistureRes.val !== null && moistureRes.val < 20) {
    try {
      // 1. Fetch user's active crop(s) for this farm
      const { data: crops } = await supabase
        .from("crops")
        .select("id, crop_name")
        .eq("farm_id", input.farmId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      const activeCrop = crops && crops.length > 0 ? crops[0] : null;
      const cropId = activeCrop ? activeCrop.id : null;
      const cropName = activeCrop ? activeCrop.crop_name : null;

      // 2. Prevent duplicate unread low-moisture alerts within 1 hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("farm_id", input.farmId)
        .eq("alert_type", "soil")
        .eq("severity", "critical")
        .eq("is_read", false)
        .gte("created_at", oneHourAgo.toISOString())
        .limit(1)
        .maybeSingle();

      if (!existingAlert) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 12); // Expiration: 12 hours

        const contextText = cropName ? `crop "${cropName}"` : "farm";
        const message = `Soil moisture for ${contextText} is critically low at ${moistureRes.val}%. Irrigation should be reviewed.`;

        await supabase.from("alerts").insert({
          farm_id: input.farmId,
          crop_id: cropId,
          user_id: user.id,
          alert_type: "soil",
          severity: "critical",
          title: "Critical Low Soil Moisture",
          message,
          expires_at: expiresAt.toISOString(),
        });
      }
    } catch (alertError) {
      console.error("Failed to automatically generate low soil moisture alert:", alertError);
      // Fail silently to satisfy error isolation (telemetry save must succeed even if alert fails)
    }
  }

  // Trigger revalidation paths
  revalidatePath("/dashboard/soil");
  revalidatePath("/dashboard");

  return { success: true };
}

export interface SoilReadingRecord {
  id: string;
  farm_id: string;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  temperature: number | null;
  organic_carbon: number | null;
  recorded_at: string;
}

export async function getSoilHistory(farmId: string): Promise<{ data?: SoilReadingRecord[]; error?: string }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // Wait, wait. Keep the original regex
  // Let's use the uuid regex that matches correctly. Wait, the original code had:
  // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Let's replace the whole query block below.
  const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!farmId || !uuidRegex2.test(farmId)) {
    return { error: "Invalid farm identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to view soil health history." };
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id")
    .eq("id", farmId)
    .eq("user_id", user.id)
    .single();

  if (farmError || !farm) {
    return { error: "Farm not found or you do not have permission to access it." };
  }

  const { data: records, error } = await supabase
    .from("soil_readings")
    .select("id, farm_id, ph, nitrogen, phosphorus, potassium, moisture, temperature, organic_carbon, recorded_at")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching soil history:", error.message);
    return { error: "Failed to load soil history." };
  }

  return { data: records as SoilReadingRecord[] };
}
