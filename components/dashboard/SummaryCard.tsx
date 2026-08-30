interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  description?: string;
  badge?: string;
  accentColor: "green" | "blue" | "cyan" | "amber";
}

const colorMap = {
  green: {
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-100 dark:border-green-900/30",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-900/30",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/30",
  },
};

export default function SummaryCard({
  title,
  value,
  icon,
  description,
  badge = "Pending Setup",
  accentColor,
}: SummaryCardProps) {
  const styles = colorMap[accentColor];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          {badge}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
          {value}
        </p>
        {description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
