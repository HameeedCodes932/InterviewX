"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LogoMark } from "./LogoMark";

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

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
            className="rounded-full bg-ix-graphite px-3.5 py-1.5 text-sm font-medium text-white"
            aria-current="page"
          >
            Dashboard
          </Link>
          <span
            className="rounded-full px-3.5 py-1.5 text-sm text-ix-charcoal/45"
            title="My Interviews will arrive in a later task"
          >
            My Interviews
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <nav className="sm:hidden" aria-label="Dashboard mobile">
          <Link
            href="/dashboard"
            className="rounded-full bg-ix-graphite px-2.5 py-1 text-xs font-medium text-white"
            aria-current="page"
          >
            Dashboard
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
              A
            </span>
            <span className="hidden min-[430px]:inline">Account</span>
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
                <p className="text-sm font-medium text-ix-graphite">Account</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ix-charcoal/50">
                  Profile details will appear when authentication is connected.
                </p>
              </div>
              <div
                role="menuitem"
                className="border-b border-[#d9d6cf]/80 px-3.5 py-3 text-sm text-ix-charcoal/45"
                aria-disabled="true"
              >
                My Interviews
                <span className="mt-0.5 block text-xs">
                  Visual placeholder — coming in a later task.
                </span>
              </div>
              <Link
                href="/login"
                role="menuitem"
                className="block px-3.5 py-3 text-sm text-ix-charcoal transition hover:bg-[#ecebe7]"
                onClick={() => setMenuOpen(false)}
              >
                Sign out
                <span className="mt-0.5 block text-xs text-ix-charcoal/45">
                  Returns to sign in — no session is cleared yet.
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
