"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  initialsFromName,
  logout,
  subscribeAuth,
} from "@/lib/auth";
import { LogoMark } from "./LogoMark";

type DashboardHeaderProps = {
  active?: "dashboard" | "history";
};

export function DashboardHeader({ active = "dashboard" }: DashboardHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const session = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    () => null,
  );

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const displayName = session?.user.full_name?.trim() || "Account";
  const displayEmail = session?.user.email || "";
  const initials = initialsFromName(displayName);

  function onSignOut() {
    setMenuOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#d9d6cf]/70 pb-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-8">
        <Link
          href="/dashboard"
          className="group inline-flex shrink-0 items-center gap-2 text-ix-graphite transition hover:opacity-90"
        >
          <LogoMark className="h-7 w-7 min-[375px]:h-8 min-[375px]:w-8" />
          <span className="font-display text-[1.2rem] font-semibold tracking-tight min-[375px]:text-[1.4rem] sm:text-[1.5rem]">
            InterviewX
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 sm:flex"
          aria-label="Dashboard"
        >
          <Link
            href="/dashboard"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              active === "dashboard"
                ? "bg-ix-graphite text-white"
                : "text-ix-charcoal/55 hover:bg-[#ecebe7] hover:text-ix-charcoal"
            }`}
            aria-current={active === "dashboard" ? "page" : undefined}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/history"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              active === "history"
                ? "bg-ix-graphite text-white"
                : "text-ix-charcoal/55 hover:bg-[#ecebe7] hover:text-ix-charcoal"
            }`}
            aria-current={active === "history" ? "page" : undefined}
          >
            My Interviews
          </Link>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <nav className="sm:hidden" aria-label="Dashboard mobile">
          <Link
            href={active === "history" ? "/dashboard/history" : "/dashboard"}
            className="rounded-full bg-ix-graphite px-2.5 py-1 text-xs font-medium text-white"
            aria-current="page"
          >
            {active === "history" ? "History" : "Dashboard"}
          </Link>
        </nav>

        <div className="relative" ref={rootRef}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#d5d3cd] bg-[#ecebe7] px-2.5 py-1.5 text-sm font-medium text-ix-charcoal transition hover:bg-[#e3e2dd] min-[375px]:px-3"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ix-graphite text-[11px] font-semibold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[9rem] truncate min-[430px]:inline">
              {displayName.split(" ")[0]}
            </span>
            <svg
              viewBox="0 0 12 12"
              className={`h-3 w-3 text-ix-charcoal/55 transition ${menuOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path
                d="M2.5 4.25 6 7.75 9.5 4.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {menuOpen ? (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#d9d6cf] bg-[#f7f6f2] shadow-[0_18px_40px_-24px_rgba(23,25,31,0.45)]"
            >
              <div className="border-b border-[#d9d6cf]/80 px-3.5 py-3">
                <p className="truncate text-sm font-medium text-ix-graphite">
                  {displayName}
                </p>
                {displayEmail ? (
                  <p className="mt-0.5 truncate text-xs leading-relaxed text-ix-charcoal/55">
                    {displayEmail}
                  </p>
                ) : null}
              </div>
              <Link
                href="/dashboard/history"
                role="menuitem"
                className="block border-b border-[#d9d6cf]/80 px-3.5 py-3 text-left text-sm text-ix-charcoal transition hover:bg-[#ecebe7]"
                onClick={() => setMenuOpen(false)}
              >
                My Interviews
                <span className="mt-0.5 block text-xs text-ix-charcoal/45">
                  Open your interview history.
                </span>
              </Link>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3.5 py-3 text-left text-sm text-ix-charcoal transition hover:bg-[#ecebe7]"
                onClick={onSignOut}
              >
                Sign out
                <span className="mt-0.5 block text-xs text-ix-charcoal/45">
                  Ends this session and returns to sign in.
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
