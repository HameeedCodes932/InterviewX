/**
 * Central backend API configuration for the Next.js app.
 *
 * Temporary browser demo authentication (if present) is unchanged —
 * this only prepares a single place to read the API base URL.
 */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/** Absolute backend origin, e.g. http://127.0.0.1:8000 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return trimTrailingSlash(fromEnv || DEFAULT_API_BASE_URL);
}

/** Versioned API root, e.g. http://127.0.0.1:8000/api/v1 */
export function getApiV1BaseUrl(): string {
  return `${getApiBaseUrl()}/api/v1`;
}

export function apiV1Url(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiV1BaseUrl()}${normalized}`;
}
