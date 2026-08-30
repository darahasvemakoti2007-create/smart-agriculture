"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-green-700 dark:text-green-500">AgriSync</span>
        </Link>
        
        <div className="flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {t("home")}
          </Link>
          <Link href="#features" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {t("features")}
          </Link>
          <Link href="#how-it-works" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {t("howItWorks")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
