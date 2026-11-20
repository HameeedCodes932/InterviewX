"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function LandingPage() {
  const { token, ready } = useAuth();
  const router = useRouter();
  const m = getMessages();

  useEffect(() => {
    if (ready && token) router.replace("/dashboard");
  }, [ready, token, router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="atmosphere-layer" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6">
        <header className="animate-rise flex items-center justify-between">
          <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {t(m, "brand.name")}
          </p>
          <div className="flex gap-2">
            <Link href="/login" className="btn-secondary">
              {t(m, "nav.login")}
            </Link>
            <Link href="/signup" className="btn-primary hidden sm:inline-flex">
              {t(m, "nav.signup")}
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center pb-16 pt-10">
          <h1 className="animate-rise-delay max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
            {t(m, "landing.headline")}
          </h1>
          <p className="animate-rise-late mt-5 max-w-xl text-lg text-ink-muted sm:text-xl">
            {t(m, "landing.subhead")}
          </p>
          <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              {t(m, "landing.ctaPrimary")}
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              {t(m, "landing.ctaSecondary")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
