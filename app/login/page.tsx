"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { useLanguage } from "@/components/LanguageContext";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");
  const { t } = useLanguage();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("NEXT_REDIRECT") || msg.includes("redirect")) {
        return;
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="orb orb-green w-[500px] h-[500px] -top-32 -left-32 opacity-30 -z-10 animate-pulse-glow" />
      <div className="orb orb-emerald w-[400px] h-[400px] -bottom-32 -right-32 opacity-20 -z-10 animate-pulse-glow delay-300" />
      <div className="bg-grid-mesh absolute inset-0 -z-10 opacity-40" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl">🌱</span>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              AgriSync
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your farmer dashboard
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl p-8 shadow-2xl neon-border">
          <h1 className="text-2xl font-extrabold text-white mb-6">
            Welcome back, Farmer 👋
          </h1>

          {/* Login Type Selector (Phone vs Email) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl mb-6 border border-zinc-800">
            <button
              type="button"
              onClick={() => setLoginMode("phone")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === "phone"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>📱 Mobile Number</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("email")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === "email"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>✉️ Email Address</span>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            {loginMode === "phone" ? (
              /* Mobile Phone Number Input */
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Mobile Number (India)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-bold text-zinc-400 border-r border-zinc-700 pr-3">
                    🇮🇳 +91
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    disabled={loading}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-24 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50 font-mono tracking-wider"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Enter your 10-digit registered mobile number
                </p>
              </div>
            ) : (
              /* Email Input */
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  placeholder="farmer@agrisync.in"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-green-950/50 hover:from-green-500 hover:to-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed beam-sweep"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In to Dashboard →"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-xs text-zinc-400">
            Don&apos;t have a farm account?{" "}
            <Link
              href="/register"
              className="font-bold text-green-400 hover:text-green-300 transition-colors"
            >
              Create New Account
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to AgriSync Home
          </Link>
        </p>
      </div>
    </div>
  );
}
