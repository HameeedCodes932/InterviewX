/**
 * Verifies stored JWT sessions against GET /api/v1/auth/me.
 * Caches a successful verification per access token to avoid
 * unnecessary repeated calls during normal client navigation.
 */

import { ApiError, apiFetch } from "@/lib/api";
import {
  clearInFlightVerification,
  getInFlightVerification,
  getVerifiedToken,
  invalidateSessionVerification,
  markSessionVerified,
  setInFlightVerification,
} from "./sessionCache";
import { getSessionSnapshot, writeSession } from "./storage";
import type { AuthUser } from "./types";

export class AuthError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export {
  invalidateSessionVerification,
  isSessionVerified,
  markSessionVerified,
} from "./sessionCache";

export async function ensureSessionVerified(): Promise<AuthUser> {
  const session = getSessionSnapshot();
  if (!session) {
    invalidateSessionVerification();
    throw new AuthError("unauthenticated", "Not authenticated.", 401);
  }

  if (getVerifiedToken() === session.accessToken) {
    return session.user;
  }

  const existing = getInFlightVerification();
  if (existing.promise && existing.token === session.accessToken) {
    return existing.promise as Promise<AuthUser>;
  }

  const token = session.accessToken;
  const promise = (async () => {
    try {
      const user = await apiFetch<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      writeSession({ accessToken: token, user });
      markSessionVerified(token);
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        invalidateSessionVerification();
        writeSession(null);
        throw new AuthError(
          "unauthenticated",
          "Session expired. Please sign in again.",
          401,
        );
      }
      throw new AuthError(
        "network",
        "Unable to verify your session with the API.",
      );
    } finally {
      clearInFlightVerification(token);
    }
  })();

  setInFlightVerification(token, promise);
  return promise;
}
