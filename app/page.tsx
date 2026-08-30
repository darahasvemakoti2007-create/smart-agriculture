"use client";

import { LanguageProvider } from "@/components/LanguageContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustSection from "@/components/TrustSection";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <TrustSection />
          <Features />
          <HowItWorks />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
