"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteCropImage, analyzeCropImage } from "@/app/dashboard/crops/[cropId]/images/actions";

export interface CropImageItem {
  id: string;
  crop_id: string;
  cloudinary_public_id: string | null;
  image_url: string;
  image_type: string;
  uploaded_at: string;
}

export interface DiseaseAnalysis {
  id: string;
  image_id: string;
  disease_name: string;
  confidence: number;
  severity: string | null;
  symptoms: string[];
  ai_response: any;
  created_at: string;
}

interface CropImageGalleryProps {
  cropId: string;
  images: CropImageItem[];
  analyses?: DiseaseAnalysis[];
  onOpenUploader?: () => void;
}

const typeBadges: Record<string, { label: string; color: string }> = {
  leaf: { label: "Leaf / Foliage", color: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
  crop: { label: "Full Crop", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  soil: { label: "Soil / Roots", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  pest: { label: "Pest / Insect", color: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
  other: { label: "Field Inspection", color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" },
};

export default function CropImageGallery({
  cropId,
  images,
  analyses = [],
  onOpenUploader,
}: CropImageGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    setError(null);
    try {
      const result = await deleteCropImage(imageId, cropId);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred while deleting the image.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleAnalyze(imageId: string) {
    setAnalyzingId(imageId);
    setError(null);
    try {
      const result = await analyzeCropImage(imageId, cropId);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred during AI analysis.");
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Crop Imagery Gallery ({images.length})
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Stored high-resolution assets ready for upcoming AI disease diagnosis
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-xs sm:text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {images.map((img) => {
            const badge = typeBadges[img.image_type] || typeBadges.other;
            const isDeleting = deletingId === img.id;
            const isConfirming = confirmDeleteId === img.id;
            const isAnalyzing = analyzingId === img.id;
            
            const imageAnalyses = analyses.filter(a => a.image_id === img.id);
            const latestAnalysis = imageAnalyses[0];
            const historyAnalyses = imageAnalyses.slice(1);

            return (
              <div
                key={img.id}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs transition-all flex flex-col justify-between"
              >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Left Side: Image */}
                  <div className="md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
                    <div
                      onClick={() => setPreviewModalUrl(img.image_url)}
                      className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-900 cursor-pointer overflow-hidden shrink-0"
                    >
                      <Image
                        src={img.image_url}
                        alt="Crop diagnostic photo"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-xs">
                          🔍 Click to Zoom
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {new Date(img.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAnalyze(img.id)}
                          disabled={isAnalyzing}
                          className="w-full py-2 px-4 mt-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <span className="animate-spin">🌀</span> AI is analyzing...
                            </>
                          ) : (
                            <>
                              ✨ Analyze with AI
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Cloudinary Linked
                        </span>

                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              disabled={isDeleting || isAnalyzing}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? "Deleting…" : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting || isAnalyzing}
                              className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(img.id)}
                            disabled={isAnalyzing}
                            className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: AI Analysis */}
                  <div className="md:w-1/2 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
                      🌿 AI Crop Analysis
                    </h3>
                    
                    {latestAnalysis ? (
                      latestAnalysis.ai_response?.is_plant_image === false ? (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300 flex-1">
                          <p className="font-semibold mb-1">Unable to analyze this image</p>
                          <p className="text-xs opacity-90">The uploaded image does not appear to contain a clear plant or crop.</p>
                        </div>
                      ) : latestAnalysis.ai_response?.image_quality === "poor" ? (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300 flex-1">
                          <p className="font-semibold mb-1">Image quality is too low for reliable analysis.</p>
                          <p className="text-xs opacity-90">Observation: {latestAnalysis.disease_name}</p>
                          <p className="text-xs opacity-90 mt-2">{latestAnalysis.ai_response?.analysis_notes}</p>
                        </div>
                      ) : (
                        <div className="space-y-4 flex-1 text-sm overflow-y-auto pr-1 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <p className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Disease</p>
                              <p className="font-bold text-zinc-900 dark:text-white leading-tight">{latestAnalysis.disease_name}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                              <div>
                                <p className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Confidence</p>
                                <p className="font-bold text-zinc-900 dark:text-white">{latestAnalysis.confidence}%</p>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                latestAnalysis.confidence >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                                latestAnalysis.confidence >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                              }`}>
                                {latestAnalysis.confidence}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Severity</p>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              latestAnalysis.severity === 'critical' || latestAnalysis.severity === 'high' ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900' :
                              latestAnalysis.severity === 'moderate' ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900' :
                              latestAnalysis.severity === 'low' ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900' :
                              'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                            }`}>
                              {latestAnalysis.severity || "Unknown"}
                            </span>
                          </div>

                          {(latestAnalysis.symptoms?.length > 0) && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Symptoms:</p>
                              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4 marker:text-zinc-400">
                                {latestAnalysis.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}

                          {(latestAnalysis.ai_response?.possible_causes?.length > 0) && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Possible Causes:</p>
                              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4 marker:text-zinc-400">
                                {latestAnalysis.ai_response.possible_causes.map((c: string, i: number) => <li key={i}>{c}</li>)}
                              </ul>
                            </div>
                          )}

                          {(latestAnalysis.ai_response?.recommended_actions?.length > 0) && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Recommended Actions:</p>
                              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4 marker:text-zinc-400">
                                {latestAnalysis.ai_response.recommended_actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                              </ul>
                            </div>
                          )}

                          {(latestAnalysis.ai_response?.prevention_tips?.length > 0) && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Prevention:</p>
                              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4 marker:text-zinc-400">
                                {latestAnalysis.ai_response.prevention_tips.map((p: string, i: number) => <li key={i}>{p}</li>)}
                              </ul>
                            </div>
                          )}

                          {latestAnalysis.ai_response?.analysis_notes && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">AI Note:</p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">"{latestAnalysis.ai_response.analysis_notes}"</p>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                          ✨
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-1">No Analysis Yet</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Click the analyze button to process this image with Gemini AI.</p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">Disclaimer:</span> AI-generated analysis is for agricultural decision support and may be inaccurate. Consider consulting a qualified agricultural professional for important crop decisions.
                      </p>
                    </div>

                    {historyAnalyses.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-2">Previous Analyses ({historyAnalyses.length})</p>
                        <div className="space-y-2">
                          {historyAnalyses.map(hist => (
                            <div key={hist.id} className="text-xs flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-semibold truncate">{hist.disease_name}</span>
                                <span className="text-[10px] text-zinc-500">({hist.confidence}%)</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                                {new Date(hist.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 p-10 sm:p-14 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-3xl flex items-center justify-center mb-4">
            📷
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2">
            No crop images yet
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Upload a clear crop or leaf image. AI disease analysis and automated pathogen detection will be available in the next stage.
          </p>
          {onOpenUploader && (
            <button
              onClick={onOpenUploader}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>+</span>
              <span>Upload First Image</span>
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800"
          >
            <Image
              src={previewModalUrl}
              alt="Full resolution crop preview"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 text-white text-base font-bold flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
