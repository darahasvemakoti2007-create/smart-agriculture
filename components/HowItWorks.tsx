"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      number: "01",
      title: t("step1Title"),
      description: t("step1Desc"),
      icon: "🏡"
    },
    {
      number: "02",
      title: t("step2Title"),
      description: t("step2Desc"),
      icon: "🧪"
    },
    {
      number: "03",
      title: t("step3Title"),
      description: t("step3Desc"),
      icon: "💡"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-zinc-100/50 dark:bg-zinc-900/30 border-b border-zinc-200/30 dark:border-zinc-800/20 relative">
      <div className="absolute top-1/4 left-10 w-[300px] h-[300px] bg-green-500/5 blur-3xl -z-10 rounded-full animate-pulse-glow" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200/30">
            {t("workflow")}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-4 mb-4">
            {t("howItWorksTitle")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-655 dark:text-zinc-400">
            {t("howItWorksSub")}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Horizontal Connector Line for Desktop */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-green-200/40 via-green-400/30 to-green-200/40 dark:from-green-900/30 dark:via-green-700/20 dark:to-green-900/30 -z-10"></div>

          {steps.map((step, i) => (
            <div 
              key={i} 
              className="relative flex flex-col items-center text-center group"
            >
              {/* Outer Step Indicator Ring */}
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border-4 border-green-50 dark:border-green-950/50 shadow-md group-hover:scale-105 group-hover:border-green-500 transition-all duration-350 mb-6 relative">
                <span className="text-3xl">{step.icon}</span>
                <span className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-xs">
                  {step.number}
                </span>
              </div>

              {/* Text Card Box */}
              <div className="glass-card rounded-2xl p-6 w-full max-w-[280px] hover:border-green-200 dark:hover:border-green-800/80 transition-all duration-300">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
