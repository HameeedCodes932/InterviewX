"use client";

import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { getMessages, t } from "@/lib/i18n";

export default function SettingsPage() {
  const m = getMessages();
  return (
    <RequireAuth>
      <AppShell>
        <section className="mb-8">
          <h1 className="font-display text-3xl text-ink">{t(m, "settings.title")}</h1>
          <p className="mt-2 text-ink-muted">{t(m, "settings.subtitle")}</p>
        </section>
        <div className="max-w-xl rounded-xl border border-ink/10 bg-white/55 p-6">
          <h2 className="font-medium text-ink">Language</h2>
          <p className="mt-2 text-sm text-ink-muted">{t(m, "settings.languageNote")}</p>
          <select className="field mt-4" defaultValue="en" disabled>
            <option value="en">English</option>
          </select>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
