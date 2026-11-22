/**
 * Shared GET /interviews/{id} failure classification.
 * Used by the production client and the lightweight regression script.
 */

export type GetInterviewSessionErrorCode =
  | "not_found"
  | "unauthenticated"
  | "fetch_failed"
  | "network";

/**
 * Map an HTTP status (or null for a non-HTTP/network failure) to the
 * client error code consumed by InterviewRoom.
 *
 * FastAPI returns 422 when the path UUID cannot be parsed; treat that the
 * same as a missing session so the room shows the not-found state.
 */
export function mapGetInterviewSessionErrorCode(
  status: number | null | undefined,
): GetInterviewSessionErrorCode {
  if (status === 404 || status === 422) return "not_found";
  if (status === 401) return "unauthenticated";
  if (status == null) return "network";
  return "fetch_failed";
}

export function messageForGetInterviewSessionError(
  code: GetInterviewSessionErrorCode,
  detailFallback?: string,
): string {
  switch (code) {
    case "not_found":
      return "Interview session not found.";
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "fetch_failed":
      return detailFallback ?? "Unable to load the interview session.";
  }
}
