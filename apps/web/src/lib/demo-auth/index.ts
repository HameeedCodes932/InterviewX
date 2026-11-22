/**
 * DEMO-ONLY browser authentication façade.
 *
 * - Accounts: localStorage `interviewx.demo.accounts` (PBKDF2 hash + salt only)
 * - Session: localStorage `interviewx.demo.session` (id/email/name — no password)
 * - Route guards are client-side only and can be bypassed; not production auth.
 */

import { hashPassword, verifyPassword } from "./crypto";
import {
  clearSessionSnapshotCache,
  consumeNextPath,
  getSessionSnapshot,
  readAccounts,
  rememberNextPath,
  subscribeDemoAuth,
  writeAccounts,
  writeSession,
} from "./storage";
import type { DemoAccountRecord, DemoAuthErrorCode, DemoSession } from "./types";

export type { DemoAccountRecord, DemoAuthErrorCode, DemoSession };
export {
  consumeNextPath,
  getSessionSnapshot,
  rememberNextPath,
  subscribeDemoAuth,
};

export class DemoAuthError extends Error {
  code: DemoAuthErrorCode;

  constructor(code: DemoAuthErrorCode, message: string) {
    super(message);
    this.name = "DemoAuthError";
    this.code = code;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSession(account: DemoAccountRecord): DemoSession {
  return {
    accountId: account.id,
    email: account.email,
    fullName: account.fullName,
    createdAt: new Date().toISOString(),
  };
}

function persistSession(session: DemoSession) {
  clearSessionSnapshotCache();
  writeSession(session);
}

export async function registerDemoAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<DemoSession> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);

  let accounts: DemoAccountRecord[];
  try {
    accounts = readAccounts();
  } catch {
    throw new DemoAuthError(
      "storage_unavailable",
      "Unable to access browser storage for demo accounts.",
    );
  }

  if (accounts.some((account) => account.email === email)) {
    throw new DemoAuthError(
      "duplicate_email",
      "An account with this email already exists. Sign in instead.",
    );
  }

  const { passwordHash, salt, iterations } = await hashPassword(input.password);
  const account: DemoAccountRecord = {
    id: createId(),
    email,
    fullName,
    passwordHash,
    salt,
    iterations,
    createdAt: new Date().toISOString(),
  };

  try {
    writeAccounts([...accounts, account]);
  } catch {
    throw new DemoAuthError(
      "storage_unavailable",
      "Unable to save the demo account in browser storage.",
    );
  }

  const session = toSession(account);
  persistSession(session);
  return session;
}

export async function loginDemoAccount(input: {
  email: string;
  password: string;
}): Promise<DemoSession> {
  const email = normalizeEmail(input.email);
  let accounts: DemoAccountRecord[];
  try {
    accounts = readAccounts();
  } catch {
    throw new DemoAuthError(
      "storage_unavailable",
      "Unable to access browser storage for demo accounts.",
    );
  }

  const account = accounts.find((entry) => entry.email === email);
  if (!account) {
    throw new DemoAuthError(
      "invalid_credentials",
      "Incorrect email or password.",
    );
  }

  const ok = await verifyPassword(
    input.password,
    account.passwordHash,
    account.salt,
    account.iterations,
  );
  if (!ok) {
    throw new DemoAuthError(
      "invalid_credentials",
      "Incorrect email or password.",
    );
  }

  const session = toSession(account);
  persistSession(session);
  return session;
}

/** Clears the demo session only — keeps registered accounts for re-login. */
export function logoutDemoSession() {
  clearSessionSnapshotCache();
  writeSession(null);
}

export function getDemoSession(): DemoSession | null {
  return getSessionSnapshot();
}

export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}
