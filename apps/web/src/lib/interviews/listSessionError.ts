/**
 * Shared GET /interviews failure classification.
 */

export type ListInterviewSessionsErrorCode =
  | "unauthenticated"
  | "list_failed"
  | "network";

export function mapListInterviewSessionsErrorCode(
  status: number | null | undefined,
): ListInterviewSessionsErrorCode {
  if (status === 401) return "unauthenticated";
  if (status == null) return "network";
  return "list_failed";
}

export function messageForListInterviewSessionsError(
  code: ListInterviewSessionsErrorCode,
  detailFallback?: string,
): string {
  switch (code) {
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "list_failed":
      return detailFallback ?? "Unable to load interview history.";
  }
}
