"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type InterviewSession } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function HistoryPage() {
  const { token } = useAuth();
  const m = getMessages();
  const [sessions, setSessions] = useState<InterviewSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .interviews(token)
      .then(setSessions)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <RequireAuth>
      <AppShell>
        <section className="mb-8">
          <h1 className="font-display text-3xl text-ink">{t(m, "history.title")}</h1>
          <p className="mt-2 text-ink-muted">{t(m, "history.subtitle")}</p>
        </section>

        {error ? <p className="text-red-700">{error}</p> : null}
        {sessions && sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 bg-white/40 p-10 text-center">
            <p className="text-ink-muted">{t(m, "history.empty")}</p>
            <Link href="/dashboard" className="btn-secondary mt-4 inline-flex">
              {t(m, "nav.dashboard")}
            </Link>
          </div>
        ) : null}
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/55 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{s.category_slug}</p>
                  <p className="text-sm text-ink-muted">
                    {s.status} · {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
                {s.has_report ? (
                  <Link href="/reports" className="text-sm text-teal hover:underline">
                    {t(m, "history.viewReport")}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
