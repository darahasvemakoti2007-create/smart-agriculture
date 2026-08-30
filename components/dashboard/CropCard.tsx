import Link from "next/link";

export interface Crop {
  id: string;
  farm_id: string;
  crop_name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: "active" | "harvested" | "failed" | "planned";
  created_at: string;
  farm_name?: string;
}

interface CropCardProps {
  crop: Crop;
}

const statusConfig = {
  active: {
    label: "Active Growing",
    badge: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  harvested: {
    label: "Harvested",
    badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  planned: {
    label: "Planned",
    badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  failed: {
    label: "Failed",
    badge: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  },
};

// Fun dynamic crop emoji picker based on common agricultural crops
function getCropEmoji(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("wheat") || lower.includes("rice") || lower.includes("paddy")) return "🌾";
  if (lower.includes("corn") || lower.includes("maize")) return "🌽";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("cotton")) return "☁️";
  if (lower.includes("sugarcane")) return "🎋";
  if (lower.includes("grape")) return "🍇";
  if (lower.includes("apple")) return "🍎";
  if (lower.includes("chili") || lower.includes("pepper")) return "🌶️";
  if (lower.includes("onion") || lower.includes("garlic")) return "🧅";
  return "🌿";
}

export default function CropCard({ crop }: CropCardProps) {
  const statusInfo = statusConfig[crop.status] || statusConfig.active;
  const emoji = getCropEmoji(crop.crop_name);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs hover:shadow-md hover:border-green-300 dark:hover:border-green-900/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center text-2xl shrink-0">
              {emoji}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                {crop.crop_name}
              </h3>
              {crop.variety ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Variety: <span className="font-semibold">{crop.variety}</span>
                </p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-0.5">
                  Standard variety
                </p>
              )}
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.badge}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Farm Name tag */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>🏡</span>
            <span>{crop.farm_name || "Assigned Farm"}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 dark:border-zinc-900 text-xs">
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 block">Planting Date</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
              {crop.planting_date
                ? new Date(crop.planting_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not recorded"}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 block">Expected Harvest</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
              {crop.expected_harvest_date
                ? new Date(crop.expected_harvest_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not recorded"}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs">
        <span className="text-zinc-400 dark:text-zinc-500">ID: {crop.id.slice(0, 8)}...</span>
        <Link
          href={`/dashboard/crops/${crop.id}/images`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 font-semibold text-xs hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
        >
          <span>📷</span>
          <span>Upload / View Images</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
