"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">AgriSync</span>
        </div>
        <p className="text-zinc-505 dark:text-zinc-400">
          {t("footerSub")}
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-4">
          &copy; {new Date().getFullYear()} {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
