"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type EvaluationReport } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function ReportDetailPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const m = getMessages();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.id) return;
    api
      .report(token, params.id)
      .then(setReport)
      .catch(() => setError(t(m, "reports.notFound")));
  }, [token, params.id, m]);

  return (
    <RequireAuth>
      <AppShell>
        <Link href="/reports" className="text-sm text-teal hover:underline">
          ← {t(m, "nav.reports")}
        </Link>
        <h1 className="mt-4 font-display text-3xl text-ink">
          {t(m, "reports.detailTitle")}
        </h1>
        {error ? <p className="mt-4 text-red-700">{error}</p> : null}
        {report ? (
          <div className="mt-6 space-y-4 rounded-xl border border-ink/10 bg-white/55 p-6">
            <p className="text-sm text-ink-muted">
              {report.category_slug} · {new Date(report.created_at).toLocaleString()}
            </p>
            <p className="text-ink">
              {report.summary || "Report shell — evaluation pipeline not connected yet."}
            </p>
            {report.rubric ? (
              <pre className="overflow-auto rounded-lg bg-ink/5 p-4 text-xs text-ink">
                {JSON.stringify(report.rubric, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
