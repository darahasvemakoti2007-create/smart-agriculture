"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { uploadCropImage } from "@/app/dashboard/crops/[cropId]/images/actions";

interface CropImageUploaderProps {
  cropId: string;
  cropName: string;
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CropImageUploader({
  cropId,
  cropName,
  onUploadSuccess,
}: CropImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("leaf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelection(file: File) {
    setError(null);
    setSuccess(null);

    // Client-side MIME type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file format. Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    // Client-side file size check (10MB)
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum allowed size is 10 MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("image_type", imageType);

    try {
      const result = await uploadCropImage(cropId, formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        setSuccess("Image uploaded successfully to Cloudinary!");
        setLoading(false);
        handleClear();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch {
      setError("An unexpected error occurred during upload. Please try again.");
      setLoading(false);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span>📷</span>
          <span>Upload Crop Image</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Take a clear photo of the crop leaf, root, or affected area for {cropName}.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-300 flex items-center justify-between">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {!selectedFile ? (
        /* Drag and drop upload zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
              : "border-zinc-300 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-600 bg-zinc-50/50 dark:bg-zinc-900/30"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 flex items-center justify-center text-3xl mb-4 shadow-2xs">
            🌿
          </div>
          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-1">
            Click to upload or drag and drop leaf photo
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
            Supports high-resolution JPG, PNG, or WEBP photos (Max: 10 MB)
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-2xs">
            Browse Files
          </span>
        </div>
      ) : (
        /* Selected File Preview & Metadata Card */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 items-center">
            {/* Thumbnail Preview */}
            <div className="relative aspect-video md:aspect-square w-full rounded-xl overflow-hidden bg-black/5 border border-zinc-200 dark:border-zinc-700">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Crop preview"
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Metadata & Configuration */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-semibold">
                  Selected Image
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Size: {formatBytes(selectedFile.size)} • Format: {selectedFile.type}
                </p>
              </div>

              {/* Image Type Tag */}
              <div>
                <label
                  htmlFor="image_type_select"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Image Category
                </label>
                <select
                  id="image_type_select"
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                >
                  <option value="leaf">Leaf / Foliage (Recommended for Disease Analysis)</option>
                  <option value="crop">Full Crop / Plant</option>
                  <option value="soil">Soil / Root Zone</option>
                  <option value="pest">Pest / Insect Area</option>
                  <option value="other">Other Farm Inspection</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Uploading to Cloudinary…</span>
                    </>
                  ) : (
                    <span>Upload Image</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
