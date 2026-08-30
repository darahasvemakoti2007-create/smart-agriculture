"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/src/lib/cloudinary";
import { analyzeImageWithGemini } from "@/src/lib/ai/disease-analysis";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_TYPES = ["crop", "leaf", "soil", "pest", "other"];

export async function uploadCropImage(cropId: string, formData: FormData) {
  const file = formData.get("image") as File | null;
  const imageTypeRaw = (formData.get("image_type") as string)?.toLowerCase() || "leaf";
  const imageType = ALLOWED_IMAGE_TYPES.includes(imageTypeRaw) ? imageTypeRaw : "leaf";

  // --- Validate Crop ID format ---
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!cropId || !uuidRegex.test(cropId)) {
    return { error: "Invalid crop identifier." };
  }

  // --- Validate File Existence ---
  if (!file || file.size === 0) {
    return { error: "Please select a valid image file to upload." };
  }

  // --- Validate File Size (10MB max) ---
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image file size exceeds the 10 MB limit." };
  }

  // --- Validate MIME Type ---
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: "Unsupported file type. Only JPG, PNG, and WEBP images are permitted.",
    };
  }

  // --- Authenticate User ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upload crop images." };
  }

  // --- Verify Crop Ownership ---
  // Ensure the target crop exists and strictly belongs to the authenticated user
  const { data: crop, error: cropCheckError } = await supabase
    .from("crops")
    .select("id")
    .eq("id", cropId)
    .eq("user_id", user.id)
    .single();

  if (cropCheckError || !crop) {
    return { error: "Unauthorized: Crop does not exist or does not belong to your account." };
  }

  // --- Process Image Buffer ---
  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return { error: "Failed to read image data. Please try again." };
  }

  // --- Upload to Cloudinary ---
  const folder = `smart-agri/crops/${cropId}`;
  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadImageToCloudinary(buffer, folder);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: "Cloudinary upload service failed. Please check your network or credentials." };
  }

  // --- Insert Image Reference into Supabase ---
  const { error: insertError } = await supabase.from("crop_images").insert({
    crop_id: cropId,
    user_id: user.id,
    cloudinary_public_id: cloudinaryResult.public_id,
    image_url: cloudinaryResult.secure_url,
    image_type: imageType,
  });

  // --- Rollback / Cleanup on Database Failure ---
  if (insertError) {
    console.error("Supabase insert failed, rolling back Cloudinary asset:", insertError.message);
    // Delete the orphaned asset from Cloudinary
    await deleteImageFromCloudinary(cloudinaryResult.public_id);
    return { error: "Unable to record image in database. The upload has been rolled back." };
  }

  // Revalidate image gallery route
  revalidatePath(`/dashboard/crops/${cropId}/images`);
  revalidatePath("/dashboard/crops");

  return { success: true };
}

export async function deleteCropImage(imageId: string, cropId: string) {
  // Validate UUIDs
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!imageId || !uuidRegex.test(imageId) || !cropId || !uuidRegex.test(cropId)) {
    return { error: "Invalid image or crop identifier." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete images." };
  }

  // --- Verify Image Ownership ---
  const { data: imageRecord, error: fetchError } = await supabase
    .from("crop_images")
    .select("id, cloudinary_public_id")
    .eq("id", imageId)
    .eq("crop_id", cropId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !imageRecord) {
    return { error: "Image not found or unauthorized to delete." };
  }

  // --- Delete Asset from Cloudinary ---
  if (imageRecord.cloudinary_public_id) {
    await deleteImageFromCloudinary(imageRecord.cloudinary_public_id);
  }

  // --- Delete Record from Supabase ---
  const { error: deleteError } = await supabase
    .from("crop_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: "Failed to remove image from database." };
  }

  revalidatePath(`/dashboard/crops/${cropId}/images`);
  return { success: true };
}

export async function analyzeCropImage(imageId: string, cropId: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!imageId || !uuidRegex.test(imageId) || !cropId || !uuidRegex.test(cropId)) {
    return { error: "Unable to analyze this image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to analyze images." };
  }

  // Verify ownership: image must belong to the user, and tie back to the crop
  const { data: imageRecord, error: fetchError } = await supabase
    .from("crop_images")
    .select("id, image_url, crop_id")
    .eq("id", imageId)
    .eq("crop_id", cropId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !imageRecord) {
    return { error: "Unable to analyze this image." };
  }

  let aiResponse;
  try {
    aiResponse = await analyzeImageWithGemini(imageRecord.image_url);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return { error: error.message || "AI analysis could not be processed. Please try again." };
  }

  // Validate AI output shape
  if (
    typeof aiResponse !== 'object' ||
    typeof aiResponse.disease_name !== 'string' ||
    typeof aiResponse.confidence !== 'number' ||
    typeof aiResponse.is_plant_image !== 'boolean' ||
    typeof aiResponse.image_quality !== 'string'
  ) {
    return { error: "AI analysis failed: The AI returned an incomplete or invalid data structure." };
  }

  if (aiResponse.confidence < 0 || aiResponse.confidence > 100) {
    return { error: "AI analysis failed: Confidence score was out of valid bounds." };
  }

  const validSeverities = ["low", "moderate", "high", "critical"];
  let dbSeverity = null;
  if (validSeverities.includes(aiResponse.severity)) {
    dbSeverity = aiResponse.severity;
  }

  // Assemble full ai metadata response (without the fields stored explicitly)
  const aiMetadata = {
    possible_causes: aiResponse.possible_causes,
    recommended_actions: aiResponse.recommended_actions,
    prevention_tips: aiResponse.prevention_tips,
    image_quality: aiResponse.image_quality,
    is_plant_image: aiResponse.is_plant_image,
    analysis_notes: aiResponse.analysis_notes
  };

  const { error: insertError } = await supabase.from("disease_analyses").insert({
    crop_id: cropId,
    user_id: user.id,
    image_id: imageId,
    disease_name: aiResponse.disease_name,
    confidence: aiResponse.confidence,
    severity: dbSeverity,
    symptoms: Array.isArray(aiResponse.symptoms) ? aiResponse.symptoms : [],
    ai_response: aiMetadata,
  });

  if (insertError) {
    console.error("DB Insert Error:", insertError);
    return { error: "Failed to save AI analysis results." };
  }

  revalidatePath(`/dashboard/crops/${cropId}/images`);
  return { success: true };
}
