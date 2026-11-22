/**
 * DEMO-ONLY localStorage persistence for accounts + session.
 * Easy to delete when real backend auth lands.
 */

import type { DemoAccountRecord, DemoSession } from "./types";

export const DEMO_ACCOUNTS_KEY = "interviewx.demo.accounts";
export const DEMO_SESSION_KEY = "interviewx.demo.session";
export const DEMO_NEXT_KEY = "interviewx.demo.next";

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeDemoAuth(onStoreChange: Listener) {
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStoreChange);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStoreChange);
    }
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readAccounts(): DemoAccountRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = safeParseJson<DemoAccountRecord[]>(
      localStorage.getItem(DEMO_ACCOUNTS_KEY),
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAccounts(accounts: DemoAccountRecord[]) {
  localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
  emitChange();
}

export function readSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = safeParseJson<DemoSession>(
      localStorage.getItem(DEMO_SESSION_KEY),
    );
    if (!parsed?.accountId || !parsed.email || !parsed.fullName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: DemoSession | null) {
  if (session) {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
  emitChange();
}

export function rememberNextPath(path: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (path && path.startsWith("/") && !path.startsWith("//")) {
      sessionStorage.setItem(DEMO_NEXT_KEY, path);
    } else {
      sessionStorage.removeItem(DEMO_NEXT_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function consumeNextPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const next = sessionStorage.getItem(DEMO_NEXT_KEY);
    sessionStorage.removeItem(DEMO_NEXT_KEY);
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Cached snapshot for useSyncExternalStore (stable reference when unchanged). */
let cachedSessionRaw: string | null | undefined;
let cachedSession: DemoSession | null = null;

export function getSessionSnapshot(): DemoSession | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DEMO_SESSION_KEY);
  } catch {
    return null;
  }
  if (raw === cachedSessionRaw) return cachedSession;
  cachedSessionRaw = raw;
  cachedSession = readSession();
  return cachedSession;
}

export function clearSessionSnapshotCache() {
  cachedSessionRaw = undefined;
  cachedSession = null;
}
