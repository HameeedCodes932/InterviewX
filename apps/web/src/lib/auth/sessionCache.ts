/**
 * In-memory cache of which access token has been verified via /auth/me.
 * Kept free of storage/API imports to avoid circular dependencies.
 */

let verifiedToken: string | null = null;
let inFlight: Promise<unknown> | null = null;
let inFlightToken: string | null = null;

export function invalidateSessionVerification() {
  verifiedToken = null;
  inFlight = null;
  inFlightToken = null;
}

export function markSessionVerified(accessToken: string) {
  verifiedToken = accessToken;
  inFlight = null;
  inFlightToken = null;
}

export function isSessionVerified(accessToken: string | null | undefined): boolean {
  return Boolean(accessToken && verifiedToken === accessToken);
}

export function getVerifiedToken(): string | null {
  return verifiedToken;
}

export function getInFlightVerification(): {
  promise: Promise<unknown> | null;
  token: string | null;
} {
  return { promise: inFlight, token: inFlightToken };
}

export function setInFlightVerification(
  token: string,
  promise: Promise<unknown>,
) {
  inFlightToken = token;
  inFlight = promise;
}

export function clearInFlightVerification(token: string) {
  if (inFlightToken === token) {
    inFlight = null;
    inFlightToken = null;
  }
}
