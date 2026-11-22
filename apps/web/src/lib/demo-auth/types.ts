/**
 * DEMO-ONLY authentication types.
 * Browser localStorage stand-in — replace with real backend auth later.
 * Client-side route protection is for demo navigation and can be bypassed.
 */

export type DemoAccountRecord = {
  id: string;
  email: string;
  fullName: string;
  /** Base64-encoded PBKDF2 derived key — never a plain-text password. */
  passwordHash: string;
  /** Base64-encoded random salt. */
  salt: string;
  iterations: number;
  createdAt: string;
};

export type DemoSession = {
  accountId: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type DemoAuthErrorCode =
  | "duplicate_email"
  | "invalid_credentials"
  | "storage_unavailable";
