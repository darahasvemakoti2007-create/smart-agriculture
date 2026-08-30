"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  uploadAndAnalyzeIndependentImage,
  getFarmsAndCropsForSelector,
  saveDiseaseAnalysisToCrop,
  getDiseaseAnalysisHistory,
  SelectorCrop,
  DiseaseHistoryRecord,
} from "@/app/dashboard/disease/actions";

interface DiagnosticResult {
  imageUrl: string;
  cloudinaryPublicId: string;
  analysis: {
    disease_name: string;
    confidence: number;
    severity: string | null;
    symptoms: string[];
    possible_causes: string[];
    recommended_actions: string[];
    prevention_tips: string[];
    image_quality: string;
    is_plant_image: boolean;
    analysis_notes: string;
  };
}

export default function DiseaseHub() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  // Crop Selector & Saving states
  const [crops, setCrops] = useState<SelectorCrop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>( "");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // History states
  const [history, setHistory] = useState<DiseaseHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "healthy" | "disease" | "risk">("all");

  const [mounted, setMounted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCropsAndHistory = async () => {
    // 1. Load active crops for selector
    try {
      const res = await getFarmsAndCropsForSelector();
      if (res.data) {
        setCrops(res.data);
      }
    } catch (err) {
      console.error("Failed to load active crops list for selector:", err);
    }

    // 2. Load historical diagnostics
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await getDiseaseAnalysisHistory();
      if (res.error) {
        setHistoryError(res.error);
      } else if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      setHistoryError("Unable to load diagnostic history right now.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch context on mount
  useEffect(() => {
    loadCropsAndHistory();
  }, []);

  // Filter crops by farm
  const farmCrops = crops;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSaveMessage(null);
    setSaveError(null);

    if (!selectedFile || selectedFile.size === 0) {
      setError("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size exceeds the 10 MB maximum limit.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Unsupported file format. Only JPG, PNG, and WEBP image uploads are allowed.");
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setResult(null); 
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResult(null);
    setError(null);
    setSaveMessage(null);
    setSaveError(null);
    setSelectedCropId("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadAndAnalyzeIndependentImage(formData);
      if (!res.success) {
        setError(res.error || "Unable to analyze this image right now. Please try again.");
      } else if (res.data) {
        setResult(res.data as DiagnosticResult);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCrop = async () => {
    if (!result || !selectedCropId) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await saveDiseaseAnalysisToCrop(
        selectedCropId,
        result.imageUrl,
        result.cloudinaryPublicId,
        result.analysis
      );

      if (!res.success) {
        setSaveError(res.error || "Unable to save this diagnosis right now. Please try again.");
      } else {
        setSaveMessage("Diagnosis saved successfully.");
        // Refresh history immediately without browser reload
        const historyRes = await getDiseaseAnalysisHistory();
        if (historyRes.data) {
          setHistory(historyRes.data);
        }
      }
    } catch (err) {
      setSaveError("Unable to save this diagnosis right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getSeverityStyles = (severity: string | null) => {
    if (!severity) return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    const s = severity.toLowerCase();
    switch (s) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "high":
        return "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      case "moderate":
      case "medium":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case "low":
      default:
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
    }
  };

  const isHealthy =
    result?.analysis.disease_name.toLowerCase() === "healthy" ||
    result?.analysis.disease_name.toLowerCase() === "none";

  // Filtered diagnostic history records
  const filteredHistory = history.filter((rec) => {
    const nameLower = rec.disease_name.toLowerCase();
    const isRecHealthy = nameLower === "healthy" || nameLower === "none" || nameLower === "normal";

    if (filterMode === "healthy") {
      return isRecHealthy;
    }
    if (filterMode === "disease") {
      return !isRecHealthy;
    }
    if (filterMode === "risk") {
      const sev = rec.severity?.toLowerCase() || "";
      const risk = rec.risk_level?.toLowerCase() || "";
      return ["high", "critical"].includes(sev) || ["high", "critical"].includes(risk);
    }
    return true; // "all"
  });

  return (
    <div className="space-y-8">
      {/* Upload and analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Image Upload Drag & Drop Area */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Leaf Image Upload
            </h3>

            {!previewUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[250px] transition-all cursor-pointer ${
                  dragActive
                    ? "border-green-500 bg-green-50/20 dark:bg-green-950/10"
                    : "border-zinc-300 hover:border-green-500 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <span className="text-4xl mb-3">📸</span>
                <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Drag & Drop leaf photo here
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-555 mb-4">
                  or click to browse library files
                </p>
                <div className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 px-3 py-1 rounded-md">
                  JPG, PNG, WEBP · Max 10MB
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-center min-h-[250px] max-h-[350px]">
                <img
                  src={previewUrl}
                  alt="Leaf preview"
                  className="max-h-[300px] w-auto object-contain rounded-xl p-2"
                />
                <button
                  onClick={handleRemoveImage}
                  disabled={loading || saving}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400 text-center">
                {error}
              </div>
            )}
          </div>

          {previewUrl && (
            <div className="mt-5 pt-4 border-t border-zinc-150 dark:border-zinc-855 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || saving || !file}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-655 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing leaf image...
                  </>
                ) : (
                  "Analyze Crop Image"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Card: Diagnosis & Assignment Workspace */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px] space-y-4 h-full">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
              <h3 className="text-base font-bold text-zinc-700 dark:text-white">Diagnosing Crop Symptoms...</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-555 max-w-xs leading-relaxed">
                Gemini Vision is inspecting leaf metrics, spots, discoloration, and structural details to run pathology lookup.
              </p>
            </div>
          ) : result ? (
            <div className={`bg-white dark:bg-zinc-955 border rounded-2xl p-6 shadow-xs space-y-5 h-full ${
              isHealthy
                ? "border-green-200 dark:border-green-900/50"
                : "border-zinc-200 dark:border-zinc-800"
            }`}>
              <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3 flex justify-between items-start gap-4">
                <div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isHealthy
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {isHealthy ? "Healthy" : "Attention Required"}
                  </span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-1.5 leading-tight">
                    {result.analysis.disease_name}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">AI Confidence</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white">
                    {result.analysis.confidence}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-zinc-450 uppercase block font-semibold">Severity</span>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityStyles(result.analysis.severity)}`}>
                    {result.analysis.severity || "N/A"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-zinc-455 uppercase block font-semibold">Quality check</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-300 capitalize">{result.analysis.image_quality}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">AI Advisory Notes</span>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                  {result.analysis.analysis_notes}
                </p>
              </div>

              {result.analysis.symptoms.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Observed Symptoms</span>
                  <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    {result.analysis.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.recommended_actions.length > 0 && (
                <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl p-4">
                  <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Recommended Action Steps</span>
                  <ul className="space-y-1.5">
                    {result.analysis.recommended_actions.map((act, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-650 dark:text-zinc-455 leading-relaxed font-semibold">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-zinc-300 text-green-600 focus:ring-green-550"
                        />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Associate Diagnosis Section */}
              <div className="border-t border-zinc-100 dark:border-zinc-850 pt-4 mt-4 space-y-3">
                <h5 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">
                  Associate Diagnosis
                </h5>

                {farmCrops.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-center">
                    No crops available. Create a crop first to save this diagnosis.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="crop-link-select" className="block text-[10px] font-bold text-zinc-455 dark:text-zinc-550 uppercase tracking-wider">
                        Select Farm / Crop
                      </label>
                      <select
                        id="crop-link-select"
                        value={selectedCropId}
                        onChange={(e) => setSelectedCropId(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
                      >
                        <option value="">-- Choose active crop context --</option>
                        {farmCrops.map((c) => (
                          <option key={c.id} value={c.id}>
                            🏡 {c.farm_name} — {c.crop_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleSaveToCrop}
                      disabled={saving || !selectedCropId}
                      className="w-full px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-650 text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving diagnosis...
                        </>
                      ) : (
                        "Save Diagnosis to Crop"
                      )}
                    </button>
                  </div>
                )}

                {saveMessage && (
                  <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-3 text-xs font-semibold text-green-800 dark:text-green-400 text-center animate-fade-in">
                    {saveMessage}
                  </div>
                )}
                {saveError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400 text-center">
                    {saveError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px] h-full">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-650 mb-2">No diagnostics loaded yet.</h3>
              <p className="text-xs text-zinc-455 dark:text-zinc-500 max-w-xs leading-relaxed">
                Please drag or browse a photo in the upload panel and click "Analyze Crop Image" to inspect leaf health.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs mt-8">
        <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Diagnostic History</h3>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-500">Up to 20 recently logged plant disease checks</p>
          </div>

          {/* Client-side Filters toolbar */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "healthy", label: "Healthy" },
              { id: "disease", label: "Diseased" },
              { id: "risk", label: "High Risk" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilterMode(opt.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  filterMode === opt.id
                    ? "bg-green-600 border-green-650 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-655 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {historyError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-800 dark:text-red-400 text-center mb-4">
            {historyError}
          </div>
        )}

        {loadingHistory && history.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-555 animate-pulse">
            Loading diagnostic history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-zinc-150 dark:border-zinc-800/80 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-1">No disease analyses yet.</h4>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-550 max-w-xs leading-relaxed">
              Analyze a crop image to start building your diagnostic history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((rec) => {
              const nameLower = rec.disease_name.toLowerCase();
              const recHealthy = nameLower === "healthy" || nameLower === "none" || nameLower === "normal";
              const symptomsList = Array.isArray(rec.symptoms) ? rec.symptoms : [];

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border space-y-3 hover:shadow-xs transition-all flex flex-col justify-between ${
                    recHealthy
                      ? "border-green-100 bg-green-50/10 dark:border-green-950/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2 border-b border-zinc-150/40 dark:border-zinc-800/40 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                          🦠 {rec.disease_name}
                        </h4>
                        <div className="text-[9px] text-zinc-400 font-semibold mt-0.5 space-y-0.5">
                          <p>🌱 Crop: {rec.crop_name}</p>
                          <p>🏡 Farm: {rec.farm_name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block">Confidence</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-white">
                          {rec.confidence ? `${rec.confidence}%` : "Not available"}
                        </span>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.25 rounded-md border uppercase tracking-wider ${
                        recHealthy
                          ? "bg-green-50 text-green-700 border-green-150"
                          : getSeverityStyles(rec.severity)
                      }`}>
                        Severity: {rec.severity || "Not available"}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.25 rounded-md border uppercase tracking-wider ${
                        recHealthy
                          ? "bg-green-50 text-green-700 border-green-150"
                          : getSeverityStyles(rec.risk_level)
                      }`}>
                        Risk: {rec.risk_level || "Not available"}
                      </span>
                    </div>

                    {/* Symptoms bullets */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-450 uppercase block font-bold tracking-wider">Symptoms</span>
                      {symptomsList.length > 0 ? (
                        <ul className="list-disc pl-4 text-[10px] text-zinc-650 dark:text-zinc-400 space-y-0.5 leading-relaxed">
                          {symptomsList.map((sym: string, sIdx) => (
                            <li key={sIdx}>{sym}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-zinc-400 italic">No symptoms recorded.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-150/40 dark:border-zinc-800/40 pt-2.5 text-[9px] text-zinc-400 font-semibold">
                    <span>
                      🕒 {mounted ? new Date(rec.created_at).toLocaleDateString() : "..."}
                    </span>
                    {rec.crop_id && (
                      <Link
                        href={`/dashboard/crops/${rec.crop_id}/images`}
                        className="text-green-600 hover:text-green-755 dark:text-green-500 dark:hover:text-green-450 hover:underline flex items-center gap-0.5"
                      >
                        View Gallery →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advisory Disclaimer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-[10px] text-zinc-450 dark:text-zinc-550 max-w-2xl mx-auto leading-relaxed">
          AI-generated recommendations are for informational purposes only. Actual farming decisions should consider local conditions and professional agricultural advice.
        </p>
      </div>
    </div>
  );
}
