"use server";

import { createClient } from "@/src/lib/supabase/server";

export interface AlertRecord {
  id: string;
  user_id: string;
  farm_id: string;
  crop_id: string | null;
  alert_type: "disease" | "weather" | "irrigation" | "soil" | "general";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
  farms: {
    farm_name: string;
  } | null;
  crops: {
    crop_name: string;
  } | null;
}

/**
 * Retrieves the list of alerts for the authenticated user.
 */
export async function getAlertsList(): Promise<{ data?: AlertRecord[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: alerts, error: queryError } = await supabase
      .from("alerts")
      .select("id, user_id, farm_id, crop_id, alert_type, severity, title, message, is_read, created_at, expires_at, farms(farm_name), crops(crop_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (queryError) {
      console.error("Error fetching alerts:", queryError.message);
      return { error: "Unable to load alerts." };
    }

    const formattedAlerts: AlertRecord[] = (alerts || []).map((a: any) => {
      const farmObj = Array.isArray(a.farms) ? a.farms[0] : a.farms;
      const cropObj = Array.isArray(a.crops) ? a.crops[0] : a.crops;
      return {
        id: a.id,
        user_id: a.user_id,
        farm_id: a.farm_id,
        crop_id: a.crop_id,
        alert_type: a.alert_type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        is_read: a.is_read,
        created_at: a.created_at,
        expires_at: a.expires_at,
        farms: farmObj ? { farm_name: farmObj.farm_name } : null,
        crops: cropObj ? { crop_name: cropObj.crop_name } : null,
      };
    });

    return { data: formattedAlerts };
  } catch (err) {
    console.error("Unexpected error in getAlertsList:", err);
    return { error: "Unable to load alerts." };
  }
}

/**
 * Marks an alert as read after validating ownership and identifier format.
 */
export async function markAlertRead(alertId: string): Promise<{ success?: boolean; error?: string }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!alertId || !uuidRegex.test(alertId)) {
    return { error: "Invalid alert ID." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // 1. Verify that the target alert exists and is owned by the current authenticated user
    const { data: alert, error: fetchError } = await supabase
      .from("alerts")
      .select("id")
      .eq("id", alertId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !alert) {
      return { error: "Alert not found." };
    }

    // 2. Perform the update strictly restricted to owner user_id
    const { error: updateError } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error marking alert read:", updateError.message);
      return { error: "Unable to update alert." };
    }

    // 3. Revalidate paths to update alert counters across the application
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/alerts");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    console.error("Unexpected error in markAlertRead:", err);
    return { error: "Unable to update alert." };
  }
}
