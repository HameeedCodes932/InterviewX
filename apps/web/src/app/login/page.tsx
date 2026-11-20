"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function LoginPage() {
  const m = getMessages();
  const { setSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const auth = await api.login({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      });
      setSession(auth);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t(m, "auth.loginTitle")}
      footer={
        <>
          {t(m, "auth.needAccount")}{" "}
          <Link href="/signup" className="text-teal underline-offset-2 hover:underline">
            {t(m, "nav.signup")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-ink-muted">{t(m, "auth.email")}</span>
          <input
            className="field"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-ink-muted">{t(m, "auth.password")}</span>
          <input
            className="field"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <div className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="text-teal underline-offset-2 hover:underline"
          >
            {t(m, "auth.forgotLink")}
          </Link>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : t(m, "auth.submitLogin")}
        </button>
      </form>
    </AuthCard>
  );
}
