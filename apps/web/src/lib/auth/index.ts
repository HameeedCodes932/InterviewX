/**
 * Frontend authentication against the InterviewX API.
 */

import { ApiError, apiFetch } from "@/lib/api";
import {
  consumeNextPath,
  getSessionSnapshot,
  rememberNextPath,
  subscribeAuth,
  writeSession,
} from "./storage";
import {
  AuthError,
  ensureSessionVerified,
  invalidateSessionVerification,
  isSessionVerified,
  markSessionVerified,
} from "./sessionVerify";
import type { AuthSession, AuthTokenResponse, AuthUser } from "./types";

export type { AuthSession, AuthUser };
export {
  consumeNextPath,
  getSessionSnapshot,
  rememberNextPath,
  subscribeAuth,
};
export {
  AuthError,
  ensureSessionVerified,
  invalidateSessionVerification,
  isSessionVerified,
  markSessionVerified,
};
export {
  BCRYPT_MAX_PASSWORD_BYTES,
  PASSWORD_TOO_LONG_MESSAGE,
  isPasswordWithinBcryptLimit,
  meetsPasswordRequirements,
  passwordUtf8ByteLength,
  validateLoginPassword,
  validatePasswordForSubmit,
} from "./password";

function detailMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  }
  return fallback;
}

function toSession(payload: AuthTokenResponse): AuthSession {
  return {
    accessToken: payload.access_token,
    user: payload.user,
  };
}

export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  try {
    const payload = await apiFetch<AuthTokenResponse>("/auth/register", {
      method: "POST",
      body: {
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    });
    const session = toSession(payload);
    writeSession(session);
    markSessionVerified(session.accessToken);
    return session;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        throw new AuthError(
          "duplicate_email",
          detailMessage(error.body, "An account with this email already exists."),
          error.status,
        );
      }
      throw new AuthError(
        "register_failed",
        detailMessage(error.body, "Unable to create your account."),
        error.status,
      );
    }
    throw new AuthError(
      "network",
      "Unable to reach the authentication service. Is the API running?",
    );
  }
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  try {
    const payload = await apiFetch<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    });
    const session = toSession(payload);
    writeSession(session);
    markSessionVerified(session.accessToken);
    return session;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new AuthError(
        "invalid_credentials",
        detailMessage(error.body, "Incorrect email or password."),
        error.status,
      );
    }
    throw new AuthError(
      "network",
      "Unable to reach the authentication service. Is the API running?",
    );
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return ensureSessionVerified();
}

export function logout() {
  invalidateSessionVerification();
  writeSession(null);
}

export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}
