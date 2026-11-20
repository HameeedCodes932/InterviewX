"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { api, ApiError } from "@/lib/api";
import { getMessages, t } from "@/lib/i18n";

function ResetForm() {
  const m = getMessages();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.resetPassword(token, String(form.get("new_password") || ""));
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-700">
        Missing reset token. Request a new link from{" "}
        <Link href="/forgot-password" className="underline">
          forgot password
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block text-ink-muted">{t(m, "auth.newPassword")}</span>
        <input
          className="field"
          name="new_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "…" : t(m, "auth.submitReset")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const m = getMessages();
  return (
    <AuthCard
      title={t(m, "auth.resetTitle")}
      footer={
        <Link href="/login" className="text-teal underline-offset-2 hover:underline">
          {t(m, "auth.backToLogin")}
        </Link>
      }
    >
      <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
