"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

const links = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/profile", key: "profile" },
  { href: "/history", key: "history" },
  { href: "/reports", key: "reports" },
  { href: "/settings", key: "settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const m = getMessages();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-mist/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="font-display text-2xl tracking-tight text-ink">
            {t(m, "brand.name")}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-ink text-mist"
                      : "text-ink-muted hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {t(m, `nav.${link.key}`)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {user?.full_name}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
            >
              {t(m, "nav.logout")}
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-ink/5 px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-sm ${
                pathname.startsWith(link.href)
                  ? "bg-ink text-mist"
                  : "text-ink-muted"
              }`}
            >
              {t(m, `nav.${link.key}`)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
