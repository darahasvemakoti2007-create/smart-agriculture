"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function Features() {
  const { t } = useLanguage();

  const features = [
    {
      title: t("diseaseTitle"),
      description: t("diseaseDesc"),
      icon: "🌿",
      href: "/dashboard/disease",
      gradient: "from-green-500/20 to-emerald-500/5",
      accent: "text-green-400",
      border: "hover:border-green-500/40",
    },
    {
      title: t("weatherTitle"),
      description: t("weatherDesc"),
      icon: "🌦",
      href: "/dashboard/weather",
      gradient: "from-blue-500/20 to-sky-500/5",
      accent: "text-blue-400",
      border: "hover:border-blue-500/40",
    },
    {
      title: t("irrigationTitle"),
      description: t("irrigationDesc"),
      icon: "💧",
      href: "/dashboard/irrigation",
      gradient: "from-cyan-500/20 to-teal-500/5",
      accent: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    {
      title: t("soilTitle"),
      description: t("soilDesc"),
      icon: "🪨",
      href: "/dashboard/soil",
      gradient: "from-amber-500/20 to-yellow-500/5",
      accent: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
  ];

  return (
    <section id="features" className="py-28 bg-[#030712] border-t border-white/5 relative overflow-hidden">
      {/* BG decorations */}
      <div className="orb orb-green w-[500px] h-[500px] top-0 right-0 animate-pulse-glow opacity-30 -z-10" />
      <div className="bg-grid-mesh absolute inset-0 -z-10 opacity-50" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400 px-4 py-1.5 rounded-full neon-border bg-green-950/20 mb-5">
            ✦ {t("featuresCatalog")}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-2 mb-4">
            {t("featuresTitle")}
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            {t("featuresSub")}
          </p>
        </div>

        {/* 3D Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <Link
              key={i}
              href={f.href}
              className={`group relative rounded-3xl border border-white/8 bg-zinc-950/60 backdrop-blur-sm p-8 overflow-hidden transition-all duration-500 ${f.border} hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] card-3d block`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Beam sweep */}
              <div className="absolute inset-0 beam-sweep opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-white/8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 text-3xl">
                  {f.icon}
                </div>

                <h3 className={`text-xl font-bold text-white mb-3 group-hover:${f.accent} transition-colors`}>
                  {f.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm group-hover:text-zinc-300 transition-colors">
                  {f.description}
                </p>

                <div className={`mt-8 flex items-center justify-between text-xs font-bold ${f.accent} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0`}>
                  <span className="uppercase tracking-wider">{t("exploreTool")}</span>
                  <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>

              {/* Corner glow dot */}
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-current ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity animate-pulse`} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
