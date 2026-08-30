"use server";

import { createClient } from "@/src/lib/supabase/server";

import { uploadImageToCloudinary } from "@/src/lib/cloudinary";
import { analyzeImageWithGemini } from "@/src/lib/ai/disease-analysis";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAndAnalyzeIndependentImage(
  formData: FormData
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // 1. Authenticate user server-side
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // 2. Extract file from FormData
    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "Please select a valid image file." };
    }

    // 3. Size Validation
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Image size exceeds the 10 MB maximum limit." };
    }

    // 4. MIME Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Unsupported file type. Only JPG, PNG, and WEBP image uploads are supported.",
      };
    }

    // 5. Convert File to Buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch {
      return { success: false, error: "Failed to read image data. Please try again." };
    }

    // 6. Upload to Cloudinary (temporary folder)
    const folder = "smart-agri/disease-hub/temp";
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadImageToCloudinary(buffer, folder);
    } catch (error) {
      console.error("Cloudinary upload error inside Disease Hub:", error);
      return { success: false, error: "Cloudinary upload service failed. Please try again." };
    }

    // 7. Perform Gemini Vision Disease Analysis
    let aiResponse;
    try {
      aiResponse = await analyzeImageWithGemini(cloudinaryResult.secure_url);
    } catch (error: any) {
      console.error("Gemini Vision Disease Analysis Error:", error);
      return { success: false, error: error.message || "AI analysis could not be processed. Please try again." };
    }

    // Return successfully diagnosed payload (Database persistence deferred to step 18E)
    return {
      success: true,
      data: {
        imageUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        analysis: aiResponse,
      },
    };
  } catch (err: any) {
    console.error("Error in uploadAndAnalyzeIndependentImage action:", err);
    return {
      success: false,
      error: "Unable to analyze the image right now. Please try again.",
    };
  }
}

export interface SelectorCrop {
  id: string;
  crop_name: string;
  farm_name: string;
}

/**
 * Fetch farms and crops for user dropdown selection
 */
export async function getFarmsAndCropsForSelector(): Promise<{ data?: SelectorCrop[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: crops, error } = await supabase
      .from("crops")
      .select("id, crop_name, farms(farm_name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading crops list for selector:", error.message);
      return { error: "Unable to load crops list." };
    }

    const mappedCrops: SelectorCrop[] = (crops || []).map((c: any) => {
      const farmObj = Array.isArray(c.farms) ? c.farms[0] : c.farms;
      return {
        id: c.id,
        crop_name: c.crop_name,
        farm_name: farmObj?.farm_name || "Unknown Farm",
      };
    });

    return { data: mappedCrops };
  } catch (err) {
    console.error("Unexpected error fetching crops list:", err);
    return { error: "Unable to load crops list." };
  }
}

/**
 * Save disease analysis record tied to selected crop
 */
export async function saveDiseaseAnalysisToCrop(
  cropId: string,
  imageUrl: string,
  cloudinaryPublicId: string,
  analysis: any
): Promise<{ success: boolean; message?: string; error?: string; analysisId?: string }> {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!cropId || !uuidRegex.test(cropId)) {
    return { success: false, error: "Invalid crop identifier." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // Verify crop exists and belongs to user
    const { data: crop, error: cropError } = await supabase
      .from("crops")
      .select("id")
      .eq("id", cropId)
      .eq("user_id", user.id)
      .single();

    if (cropError || !crop) {
      return { success: false, error: "Crop not found or access denied." };
    }

    // Step 1: Save image reference to crop_images
    const { data: imgData, error: imgError } = await supabase
      .from("crop_images")
      .insert({
        crop_id: cropId,
        user_id: user.id,
        cloudinary_public_id: cloudinaryPublicId,
        image_url: imageUrl,
        image_type: "leaf",
      })
      .select("id")
      .single();

    if (imgError || !imgData) {
      console.error("DB Error inserting into crop_images:", imgError?.message);
      return { success: false, error: "Unable to save this diagnosis right now. Please try again." };
    }

    // Step 2: Validate severity and risk check constraints
    const validSeverities = ["low", "moderate", "high", "critical"];
    const dbSeverity = validSeverities.includes(analysis.severity?.toLowerCase())
      ? analysis.severity.toLowerCase()
      : null;
    const dbRisk = validSeverities.includes(analysis.risk_level?.toLowerCase())
      ? analysis.risk_level.toLowerCase()
      : null;

    // Step 3: Insert into disease_analyses
    const { data: analysisData, error: analysisError } = await supabase
      .from("disease_analyses")
      .insert({
        crop_id: cropId,
        user_id: user.id,
        image_id: imgData.id,
        disease_name: analysis.disease_name,
        confidence: typeof analysis.confidence === "number" ? analysis.confidence : 0,
        severity: dbSeverity,
        risk_level: dbRisk,
        symptoms: Array.isArray(analysis.symptoms) ? analysis.symptoms : [],
        ai_response: {
          possible_causes: analysis.possible_causes || [],
          recommended_actions: analysis.recommended_actions || [],
          prevention_tips: analysis.prevention_tips || [],
          image_quality: analysis.image_quality || "good",
          is_plant_image: analysis.is_plant_image ?? true,
          analysis_notes: analysis.analysis_notes || "",
        },
      })
      .select("id")
      .single();

    // Rollback crop_images insertion if disease_analyses fails
    if (analysisError || !analysisData) {
      console.error("DB Error inserting into disease_analyses, rolling back crop_images:", analysisError?.message);
      await supabase
        .from("crop_images")
        .delete()
        .eq("id", imgData.id)
        .eq("user_id", user.id);
      return { success: false, error: "Unable to save this diagnosis right now. Please try again." };
    }

    // Revalidate paths
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/disease");
    revalidatePath("/dashboard/crops");
    revalidatePath(`/dashboard/crops/${cropId}/images`);

    return {
      success: true,
      message: "Diagnosis saved successfully.",
      analysisId: analysisData.id,
    };
  } catch (err) {
    console.error("Unexpected error saving disease analysis:", err);
    return { success: false, error: "Unable to save this diagnosis right now. Please try again." };
  }
}

export interface DiseaseHistoryRecord {
  id: string;
  crop_id: string;
  disease_name: string;
  confidence: number;
  severity: string | null;
  risk_level: string | null;
  symptoms: any;
  created_at: string;
  crop_name: string;
  farm_name: string;
}

export async function getDiseaseAnalysisHistory(): Promise<{ data?: DiseaseHistoryRecord[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: records, error } = await supabase
      .from("disease_analyses")
      .select("id, crop_id, disease_name, confidence, severity, risk_level, symptoms, created_at, crops(crop_name, farms(farm_name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error retrieving disease analysis history:", error.message);
      return { error: "Unable to load diagnostic history right now." };
    }

    const mappedHistory: DiseaseHistoryRecord[] = (records || []).map((r: any) => {
      const cropObj = Array.isArray(r.crops) ? r.crops[0] : r.crops;
      const farmObj = cropObj ? (Array.isArray(cropObj.farms) ? cropObj.farms[0] : cropObj.farms) : null;
      return {
        id: r.id,
        crop_id: r.crop_id,
        disease_name: r.disease_name || "Unknown Diagnosis",
        confidence: typeof r.confidence === "number" ? r.confidence : 0,
        severity: r.severity,
        risk_level: r.risk_level,
        symptoms: r.symptoms,
        created_at: r.created_at,
        crop_name: cropObj?.crop_name || "Unknown Crop",
        farm_name: farmObj?.farm_name || "Unknown Farm",
      };
    });

    return { data: mappedHistory };
  } catch (err) {
    console.error("Unexpected error fetching disease history:", err);
    return { error: "Unable to load diagnostic history right now." };
  }
}
