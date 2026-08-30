"use client";

import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";

export default function CtaSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden py-32 bg-[#030712] border-t border-white/5">
      {/* Orbs */}
      <div className="orb orb-green  w-[700px] h-[700px] -top-40 -left-40 animate-pulse-glow -z-10" />
      <div className="orb orb-emerald w-[500px] h-[500px] -bottom-40 -right-40 animate-pulse-glow delay-300 -z-10" />
      <div className="bg-grid-mesh absolute inset-0 -z-10 opacity-40" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left text */}
          <div className="lg:col-span-7 text-center lg:text-left animate-fade-in-up">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400 px-4 py-1.5 rounded-full neon-border bg-green-950/20 mb-6">
              🌱 Grow with AgriSync
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mt-2 mb-6 leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed max-w-xl">
              {t("ctaSub")}
            </p>
            <Link
              href="/register"
              className="inline-block relative overflow-hidden rounded-full px-10 py-4 text-base font-bold text-white beam-sweep hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e, #4ade80)" }}
            >
              <span className="relative z-10">{t("startFree")} →</span>
            </Link>
          </div>

          {/* Right: 3D sensor card */}
          <div className="lg:col-span-5 flex justify-center animate-float">
            <div className="relative w-full max-w-sm card-3d">
              {/* Glow */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-green-500/30 to-emerald-500/10 blur-3xl" />

              {/* Card */}
              <div className="relative rounded-3xl border border-green-500/20 bg-zinc-950/80 p-4 backdrop-blur-xl neon-border shadow-2xl overflow-hidden">
                <div className="beam-sweep absolute inset-0 opacity-40 pointer-events-none" />
                <img
                  src="/images/soil_sensor_3d.jpg"
                  alt="Smart Soil Sensor"
                  className="rounded-2xl w-full object-cover aspect-[4/3]"
                />
                <div className="mt-3 flex items-center justify-between px-2">
                  <div>
                    <p className="text-[9px] text-green-400 uppercase font-bold tracking-widest">{t("soilIntelligence")}</p>
                    <p className="text-sm font-extrabold text-white">{t("npkOptimal")}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 animate-pulse text-lg">
                    ✓
                  </div>
                </div>
              </div>

              {/* Float badge */}
              <div className="absolute -bottom-5 -right-5 px-3 py-2 rounded-2xl bg-zinc-900 border border-emerald-500/30 shadow-xl flex items-center gap-2 animate-float delay-200">
                <span className="text-xl">🧪</span>
                <div>
                  <p className="text-[8px] text-emerald-400 uppercase font-bold tracking-wider">AI Analysis</p>
                  <p className="text-[10px] font-bold text-white">Fertilizer Ready</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
