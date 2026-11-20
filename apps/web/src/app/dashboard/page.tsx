"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError, type Dashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const m = getMessages();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .dashboard(token)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"));
  }, [token]);

  async function startInterview() {
    if (!token || starting) return;
    setStarting(true);
    setError(null);
    try {
      const res = await api.startInterview(token, {
        category_slug: "software-engineering",
        interviewer_gender: data?.preferred_interviewer,
        language: "en",
        difficulty: "mid",
      });
      const q = new URLSearchParams({
        token: res.token,
        url: res.livekit_url,
        gender: res.interviewer_gender || data?.preferred_interviewer || "female",
      });
      router.push(`/interview/${res.session_id}?${q.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t(m, "interview.startError"),
      );
      setStarting(false);
    }
  }

  return (
    <RequireAuth>
      <AppShell>
        {!data && !error ? (
          <p className="text-ink-muted">Loading dashboard…</p>
        ) : null}
        {error ? <p className="mb-4 text-red-700">{error}</p> : null}
        {data ? (
          <div className="space-y-10">
            <section className="animate-rise">
              <h1 className="font-display text-3xl text-ink sm:text-4xl">
                {t(m, "dashboard.welcome", { name: data.full_name.split(" ")[0] })}
              </h1>
              <p className="mt-2 max-w-2xl text-ink-muted">
                {t(m, "dashboard.welcomeSub")}
              </p>
            </section>

            <section className="animate-rise-delay">
              <div className="mb-5">
                <h2 className="font-display text-2xl text-ink">
                  {t(m, "dashboard.pathTitle")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">{t(m, "dashboard.pathSub")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.categories.map((cat) => (
                  <article
                    key={cat.slug}
                    className={`path-card ${
                      cat.available ? "path-card-available" : "path-card-soon"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl text-ink">{cat.name}</h3>
                      <span
                        className={`shrink-0 text-xs font-medium uppercase tracking-wide ${
                          cat.available ? "text-teal" : "text-brass"
                        }`}
                      >
                        {cat.available
                          ? t(m, "dashboard.available")
                          : t(m, "dashboard.comingSoon")}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-ink-muted">
                      {cat.description}
                    </p>
                    {cat.disclaimer ? (
                      <p className="mt-2 text-xs text-ink-muted/80">{cat.disclaimer}</p>
                    ) : null}
                    {cat.available ? (
                      <button
                        type="button"
                        className="btn-primary mt-4"
                        onClick={startInterview}
                        disabled={starting}
                      >
                        {starting
                          ? t(m, "interview.starting")
                          : t(m, "dashboard.startInterview")}
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="animate-rise-late grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-ink/10 bg-white/50 p-5 lg:col-span-1">
                <h3 className="text-sm font-medium uppercase tracking-wide text-ink-muted">
                  {t(m, "dashboard.selectedInterviewer")}
                </h3>
                <p className="mt-3 font-display text-xl text-ink">
                  {data.preferred_interviewer === "male"
                    ? t(m, "profile.male")
                    : data.preferred_interviewer === "female"
                      ? t(m, "profile.female")
                      : t(m, "dashboard.noInterviewer")}
                </p>
                <Link href="/profile" className="mt-3 inline-block text-sm text-teal hover:underline">
                  {t(m, "nav.profile")}
                </Link>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white/50 p-5 lg:col-span-1">
                <h3 className="text-sm font-medium uppercase tracking-wide text-ink-muted">
                  {t(m, "dashboard.recentInterviews")}
                </h3>
                {data.recent_sessions.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-muted">{t(m, "dashboard.noRecent")}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data.recent_sessions.map((s) => (
                      <li key={s.id} className="text-sm text-ink">
                        {s.category_slug} · {s.status}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/history" className="mt-3 inline-block text-sm text-teal hover:underline">
                  {t(m, "nav.history")}
                </Link>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white/50 p-5 lg:col-span-1">
                <h3 className="text-sm font-medium uppercase tracking-wide text-ink-muted">
                  {t(m, "dashboard.performance")}
                </h3>
                <p className="mt-3 text-sm text-ink-muted">
                  {data.performance_overview.message || t(m, "dashboard.performanceEmpty")}
                </p>
                <p className="mt-2 text-sm text-ink">
                  Interviews completed: {data.performance_overview.interviews_completed}
                  {data.performance_overview.average_score != null
                    ? ` · Avg ${data.performance_overview.average_score}/5`
                    : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link href="/profile" className="text-teal hover:underline">
                    {t(m, "nav.profile")}
                  </Link>
                  <Link href="/settings" className="text-teal hover:underline">
                    {t(m, "nav.settings")}
                  </Link>
                  <Link href="/reports" className="text-teal hover:underline">
                    {t(m, "nav.reports")}
                  </Link>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
