"use client";

import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Floating particles — client-only to avoid hydration mismatch
function Particles() {
  const [particles, setParticles] = useState<
    { id: number; size: number; left: number; delay: number; duration: number; opacity: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
        opacity: Math.random() * 0.5 + 0.3,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: "0",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// Typing animation text
function TypingText({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[index];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, phrases]);

  return (
    <span className="shimmer-text font-extrabold">
      {displayed}
      <span className="inline-block w-0.5 h-[1em] bg-green-400 ml-1 animate-pulse align-middle" />
    </span>
  );
}

// 3D tilt card wrapper
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 16}deg) rotateX(${-y * 12}deg) translateZ(20px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030712] pt-16">

      {/* Animated grid floor */}
      <div className="absolute inset-0 grid-floor opacity-30 -z-10" />

      {/* Gradient orbs */}
      <div className="orb orb-green  w-[600px] h-[600px] top-[-100px] left-[-150px] animate-pulse-glow -z-10" />
      <div className="orb orb-emerald w-[500px] h-[500px] bottom-[-80px] right-[-100px] animate-pulse-glow delay-300 -z-10" />
      <div className="orb orb-teal   w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow delay-700 -z-10" />

      {/* Floating particles */}
      <Particles />

      {/* Rotating rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none -z-10 opacity-10">
        <div className="absolute inset-0 rounded-full border border-green-500/30 animate-spin-slow" />
        <div className="absolute inset-12 rounded-full border border-green-400/20" style={{ animation: "spinSlow 30s linear infinite reverse" }} />
        <div className="absolute inset-24 rounded-full border border-emerald-500/20 animate-spin-slow" style={{ animationDuration: "15s" }} />
      </div>

      {/* Main content */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* ── LEFT: Text Column ── */}
          <div className="lg:col-span-6 text-center lg:text-left">


            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.08] animate-fade-in-up delay-100">
              {t("heroHeadingPrefix")}<br />
              <TypingText phrases={
                language === "hi" ? ["एआई खेती", "फसल एआई", "स्मार्ट मिट्टी", "एग्रीसिंक एआई"] :
                language === "bn" ? ["এআই চাষাবাদ", "ফসল এআই", "স্মার্ট মাটি", "অ্যাগ্রিসিঙ্ক এআই"] :
                language === "te" ? ["ఏఐ సాగు", "పంట ఏఐ", "స్మార్ట్ నేల", "అగ్రిసింక్ ఏఐ"] :
                language === "ta" ? ["ஏஐ விவசாயம்", "பயிர் ஏஐ", "ஸ்மார்ட் மண்", "அக்ரிசின்க் ஏஐ"] :
                ["AI Farming", "Crop AI", "Smart Soil", "AgriSync AI"]
              } />
            </h1>

            <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-zinc-400 mb-10 leading-relaxed animate-fade-in-up delay-200">
              {t("heroSub")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up delay-300">
              <Link
                href="/register"
                className="w-full sm:w-auto group relative overflow-hidden rounded-full px-8 py-3.5 text-base font-bold text-white beam-sweep transition-all duration-300 hover:scale-105 active:scale-95 text-center"
                style={{ background: "linear-gradient(135deg, #16a34a, #22c55e, #4ade80)" }}
              >
                <span className="relative z-10">{t("analyzeCrop")} →</span>
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto rounded-full border border-zinc-700 bg-zinc-900/60 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-zinc-300 hover:border-green-500/50 hover:text-white hover:bg-zinc-900 transition-all text-center"
              >
                {t("exploreFeatures")}
              </a>
            </div>

            {/* Language Translator Control */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 animate-fade-in-up delay-400">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                🌐 Language Translator:
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-zinc-900/90 border border-green-500/40 text-green-400 rounded-xl text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer shadow-lg neon-border"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="bn">বাংলা (BN)</option>
                <option value="te">తెలుగు (TE)</option>
                <option value="ta">தமிழ் (TA)</option>
              </select>
            </div>

            {/* BIG & HIGHLIGHTED Get Started & Login Buttons under Language Translator */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up delay-500">
              <Link
                href="/register"
                className="w-full sm:w-auto group relative overflow-hidden rounded-2xl px-9 py-4 text-lg font-black text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-center beam-sweep neon-border"
                style={{ background: "linear-gradient(135deg, #15803d, #16a34a, #22c55e)" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>{t("getStarted")}</span>
                  <span>→</span>
                </span>
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto rounded-2xl border-2 border-emerald-500/50 bg-zinc-900/80 backdrop-blur-md px-9 py-4 text-lg font-extrabold text-emerald-400 hover:text-white hover:bg-emerald-950/60 hover:border-emerald-400 transition-all text-center shadow-xl flex items-center justify-center gap-2"
              >
                <span>🔑</span>
                <span>{t("login")}</span>
              </Link>
            </div>


          </div>

          {/* ── RIGHT: 3D Dashboard Mockup ── */}
          <div className="lg:col-span-6 flex justify-center animate-fade-in-up delay-200">
            <TiltCard className="w-full max-w-lg">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-green-500/20 via-emerald-500/10 to-transparent blur-2xl" />

                {/* Main card */}
                <div className="relative rounded-3xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-2xl shadow-2xl overflow-hidden">
                  {/* Beam sweep on card */}
                  <div className="absolute inset-0 beam-sweep opacity-50 pointer-events-none" />

                  {/* Window bar */}
                  <div className="flex items-center gap-1.5 pb-3 border-b border-white/5 mb-3">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-auto text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">agrisync-live-telemetry</span>
                  </div>

                  {/* Top Grid: Farm image + Soil */}
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-7 relative rounded-2xl overflow-hidden">
                      <img
                        src="/images/hero_farm_3d.jpg"
                        alt="Smart Farm 3D"
                        className="w-full aspect-[4/3] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-green-500/80 text-[8px] font-bold text-white">
                        ● LIVE Feed
                      </div>
                    </div>

                    <div className="col-span-5 rounded-2xl border border-white/5 bg-zinc-900/60 p-3 flex flex-col justify-between">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Soil NPK</p>
                        <p className="text-2xl font-black text-white mt-0.5">68<span className="text-xs text-zinc-400">%</span></p>
                        <p className="text-[9px] text-green-400 font-bold">✓ Adequate</p>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: "N", val: 80, color: "#22c55e" },
                          { label: "P", val: 64, color: "#4ade80" },
                          { label: "K", val: 72, color: "#86efac" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-[7px] text-zinc-500 font-bold mb-0.5">
                              <span>{item.label}</span><span>{item.val}%</span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${item.val}%`, background: item.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom row cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: "🌡", label: "Temp", val: "28°C", ok: true },
                      { icon: "💧", label: "Moisture", val: "62%", ok: true },
                      { icon: "🔬", label: "Disease", val: "Risk: Low", ok: true },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-zinc-900/50 p-2.5 text-center hover:border-green-500/30 transition-colors">
                        <span className="text-base block">{item.icon}</span>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">{item.label}</p>
                        <p className="text-[10px] font-extrabold text-white">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-5 -right-5 px-3 py-2 rounded-2xl bg-zinc-900 border border-green-500/30 shadow-xl neon-border animate-float flex items-center gap-2">
                  <span className="text-lg">🌦</span>
                  <div>
                    <p className="text-[8px] text-green-400 uppercase font-bold tracking-wider">Weather AI</p>
                    <p className="text-[10px] font-bold text-white">Storm Warning</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-2xl bg-zinc-900 border border-amber-500/30 shadow-xl animate-float delay-300 flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <p className="text-[8px] text-amber-400 uppercase font-bold tracking-wider">AI Planner</p>
                    <p className="text-[10px] font-bold text-white">Calendar Ready</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>

        </div>
      </div>

      {/* Bottom fade-out */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
    </section>
  );
}
