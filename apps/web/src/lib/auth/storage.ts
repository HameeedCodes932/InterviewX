/**
 * Frontend auth session storage.
 *
 * Stores only the JWT access token and public user profile.
 * Never stores passwords or password hashes.
 *
 * Trade-off: localStorage is convenient for SPA refresh persistence but is
 * readable by XSS. Prefer httpOnly cookies behind a same-origin reverse proxy
 * for stronger production hardening.
 */

import type { AuthSession, AuthUser } from "./types";

export const ACCESS_TOKEN_KEY = "interviewx.auth.accessToken";
export const USER_KEY = "interviewx.auth.user";
export const NEXT_PATH_KEY = "interviewx.auth.next";

const DEMO_KEYS = [
  "interviewx.demo.accounts",
  "interviewx.demo.session",
  "interviewx.demo.next",
] as const;

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeAuth(onStoreChange: Listener) {
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

export function clearLegacyDemoAuth() {
  if (typeof window === "undefined") return;
  try {
    for (const key of DEMO_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed.email || !parsed.full_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* ignore */
  }
  cachedRaw = undefined;
  cachedSession = null;
  emitChange();
}

export function rememberNextPath(path: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (path && path.startsWith("/") && !path.startsWith("//")) {
      sessionStorage.setItem(NEXT_PATH_KEY, path);
    } else {
      sessionStorage.removeItem(NEXT_PATH_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function consumeNextPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const next = sessionStorage.getItem(NEXT_PATH_KEY);
    sessionStorage.removeItem(NEXT_PATH_KEY);
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    /* ignore */
  }
  return fallback;
}

let cachedRaw: string | null | undefined;
let cachedSession: AuthSession | null = null;

export function getSessionSnapshot(): AuthSession | null {
  if (typeof window === "undefined") return null;
  clearLegacyDemoAuth();
  let token: string | null = null;
  let userRaw: string | null = null;
  try {
    token = localStorage.getItem(ACCESS_TOKEN_KEY);
    userRaw = localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
  const raw = `${token ?? ""}|${userRaw ?? ""}`;
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  if (!token || !userRaw) {
    cachedSession = null;
    return null;
  }
  const user = readUser();
  cachedSession = user ? { accessToken: token, user } : null;
  return cachedSession;
}
