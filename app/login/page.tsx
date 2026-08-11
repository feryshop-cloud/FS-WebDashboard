"use client";

import { useState, useTransition } from "react";
import { login } from "@/actions/auth";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.success) {
        router.push("/dashboard");
      } else {
        setError(result?.error || "Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  };

  return (
    <div className="bg-card flex h-screen w-full overflow-hidden">
      {/* ====== LEFT PANEL: VISUAL BRANDING ====== */}
      <div
        className="relative hidden w-1/2 flex-col justify-end overflow-hidden lg:flex"
        style={{ backgroundColor: "#1e40af" }}
      >
        {/* Abstract wavy gradient overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-[600px] w-[600px] opacity-40"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="glow1" cx="40%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow2" cx="60%" cy="55%" r="45%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow3" cx="50%" cy="50%" r="40%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="240" cy="270" rx="200" ry="180" fill="url(#glow1)" />
            <ellipse cx="360" cy="330" rx="180" ry="170" fill="url(#glow2)" />
            <ellipse cx="300" cy="300" rx="160" ry="150" fill="url(#glow3)" />
          </svg>
        </div>

        {/* Subtle wavy line pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 200 Q200 150 400 200 T800 200" stroke="white" strokeWidth="1.5" />
          <path d="M0 260 Q200 210 400 260 T800 260" stroke="white" strokeWidth="1.5" />
          <path d="M0 320 Q200 270 400 320 T800 320" stroke="white" strokeWidth="1.5" />
          <path d="M0 380 Q200 330 400 380 T800 380" stroke="white" strokeWidth="1.5" />
          <path d="M0 440 Q200 390 400 440 T800 440" stroke="white" strokeWidth="1.5" />
          <path d="M0 500 Q200 450 400 500 T800 500" stroke="white" strokeWidth="1.5" />
          <path d="M0 560 Q200 510 400 560 T800 560" stroke="white" strokeWidth="1.5" />
          <path d="M0 620 Q200 570 400 620 T800 620" stroke="white" strokeWidth="1.5" />
        </svg>

        {/* Decorative asterisk top-left */}
        <div className="absolute top-12 left-12 z-10">
          <svg className="h-10 w-10 text-white/70" viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2 L22 16 L36 12 L24 20 L36 28 L22 24 L20 38 L18 24 L4 28 L16 20 L4 12 L18 16 Z" />
          </svg>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 px-14 pb-16">
          <p className="mb-4 text-sm font-medium tracking-wide text-blue-300/80">
            Sistem Mutasi Feryshop
          </p>
          <h2 className="max-w-[380px] text-[32px] leading-tight font-bold text-white">
            Pusat Data Stok
            <br />& Kas Terpadu
            <br />
            Feryshop
          </h2>
          <p className="mt-5 max-w-[340px] text-sm leading-relaxed text-white/40">
            Sistem mutasi khusus untuk efisiensi operasional Admin Feryshop.
          </p>
        </div>
      </div>

      {/* ====== RIGHT PANEL: FORM ====== */}
      <div className="flex w-full flex-col justify-center px-10 py-12 sm:px-16 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Decorative asterisk */}
          <div className="mb-8">
            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="#2563EB">
              <path d="M20 2 L22 16 L36 12 L24 20 L36 28 L22 24 L20 38 L18 24 L4 28 L16 20 L4 12 L18 16 Z" />
            </svg>
          </div>

          {/* Header */}
          <h1 className="text-foreground text-[28px] leading-tight font-bold tracking-tight">
            Masuk Admin
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[360px] text-sm leading-relaxed">
            Silakan masukkan kredensial untuk melanjutkan ke dashboard.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="text-faint-foreground h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="border-border bg-card text-foreground placeholder-placeholder block w-full rounded-xl border py-3 pr-4 pl-11 text-sm transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="admin@feryshop.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="text-foreground mb-1.5 block text-sm font-medium"
                htmlFor="password"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="text-faint-foreground h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="border-border bg-card text-foreground placeholder-placeholder block w-full rounded-xl border py-3 pr-11 pl-11 text-sm transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-faint-foreground hover:text-muted-foreground absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="border-input h-4 w-4 rounded text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-muted-foreground text-sm">Ingat saya</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium transition-colors"
                style={{ color: "#2563EB" }}
              >
                Lupa password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Masuk"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-muted-foreground mt-10 text-center text-sm">
            Belum punya akun? <span className="font-semibold text-blue-600">Hubungi Admin.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
