"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { api, ApiError } from "@/lib/api";
import { getMessages, t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const m = getMessages();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevUrl(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await api.forgotPassword(String(form.get("email") || ""));
      setMessage(res.message);
      if (res.reset_url) setDevUrl(res.reset_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t(m, "auth.forgotTitle")}
      footer={
        <Link href="/login" className="text-teal underline-offset-2 hover:underline">
          {t(m, "auth.backToLogin")}
        </Link>
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
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-teal">{message}</p> : null}
        {devUrl ? (
          <p className="rounded-lg bg-brass/10 p-3 text-sm text-ink">
            Dev reset link (SMTP not configured):{" "}
            <Link href={devUrl} className="underline">
              Open reset page
            </Link>
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : t(m, "auth.submitForgot")}
        </button>
      </form>
    </AuthCard>
  );
}
