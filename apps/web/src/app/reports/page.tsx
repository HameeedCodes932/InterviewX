"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type EvaluationReport } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function ReportsPage() {
  const { token } = useAuth();
  const m = getMessages();
  const [reports, setReports] = useState<EvaluationReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .reports(token)
      .then(setReports)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <RequireAuth>
      <AppShell>
        <section className="mb-8">
          <h1 className="font-display text-3xl text-ink">{t(m, "reports.title")}</h1>
          <p className="mt-2 text-ink-muted">{t(m, "reports.subtitle")}</p>
        </section>

        {error ? <p className="text-red-700">{error}</p> : null}
        {reports && reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 bg-white/40 p-10 text-center">
            <p className="text-ink-muted">{t(m, "reports.empty")}</p>
          </div>
        ) : null}
        {reports && reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.id}`}
                  className="block rounded-xl border border-ink/10 bg-white/55 px-5 py-4 transition hover:border-teal/40"
                >
                  <p className="font-medium text-ink">
                    {r.category_slug || "Interview"} report
                  </p>
                  <p className="text-sm text-ink-muted">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
