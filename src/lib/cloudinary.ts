import { v2 as cloudinary } from "cloudinary";

/**
 * Server-only Cloudinary configuration.
 *
 * CRITICAL SECURITY:
 * CLOUDINARY_API_SECRET is strictly accessed in server environments (Server Actions / Route Handlers).
 * It is NEVER exported or bundled into client-side code.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
}

/**
 * Uploads an image buffer to a designated crop folder in Cloudinary.
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Failed to upload image to Cloudinary"));
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            format: result.format,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Deletes an asset from Cloudinary using its public_id.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("Cloudinary asset deletion error:", error);
    return false;
  }
}

export default cloudinary;
