"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type Profile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

export default function ProfilePage() {
  const { token, setSession, user } = useAuth();
  const m = getMessages();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .profile(token)
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !profile) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await api.updateProfile(token, {
        full_name: String(form.get("full_name") || ""),
        headline: String(form.get("headline") || "") || null,
        bio: String(form.get("bio") || "") || null,
        interview_goal: String(form.get("interview_goal") || "") || null,
        preferred_language: String(form.get("preferred_language") || "en"),
        preferred_interviewer: String(form.get("preferred_interviewer") || "") || null,
        location: String(form.get("location") || "") || null,
        target_role: String(form.get("target_role") || "") || null,
      });
      setProfile(updated);
      if (user && token) {
        setSession({
          access_token: token,
          token_type: "bearer",
          user_id: updated.user_id,
          email: updated.email,
          full_name: updated.full_name,
        });
      }
      setStatus(t(m, "profile.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <AppShell>
        <section className="mb-8">
          <h1 className="font-display text-3xl text-ink">{t(m, "profile.title")}</h1>
          <p className="mt-2 text-ink-muted">{t(m, "profile.subtitle")}</p>
        </section>

        {!profile && !error ? <p className="text-ink-muted">Loading…</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}

        {profile ? (
          <form
            onSubmit={onSubmit}
            className="max-w-2xl space-y-4 rounded-xl border border-ink/10 bg-white/55 p-6"
          >
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "auth.fullName")}</span>
              <input
                className="field"
                name="full_name"
                defaultValue={profile.full_name}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "auth.email")}</span>
              <input className="field" value={profile.email} disabled />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.headline")}</span>
              <input
                className="field"
                name="headline"
                defaultValue={profile.headline || ""}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.targetRole")}</span>
              <input
                className="field"
                name="target_role"
                defaultValue={profile.target_role || ""}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.location")}</span>
              <input
                className="field"
                name="location"
                defaultValue={profile.location || ""}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.goal")}</span>
              <textarea
                className="field min-h-24"
                name="interview_goal"
                defaultValue={profile.interview_goal || ""}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.bio")}</span>
              <textarea
                className="field min-h-24"
                name="bio"
                defaultValue={profile.bio || ""}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">{t(m, "profile.language")}</span>
              <select
                className="field"
                name="preferred_language"
                defaultValue={profile.preferred_language || "en"}
              >
                <option value="en">English</option>
                <option value="ur" disabled>
                  Urdu (coming soon)
                </option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-muted">
                {t(m, "profile.interviewer")}
              </span>
              <select
                className="field"
                name="preferred_interviewer"
                defaultValue={profile.preferred_interviewer || ""}
              >
                <option value="">Not set</option>
                <option value="male">{t(m, "profile.male")}</option>
                <option value="female">{t(m, "profile.female")}</option>
              </select>
            </label>
            {status ? <p className="text-sm text-teal">{status}</p> : null}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "…" : t(m, "profile.save")}
            </button>
          </form>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
