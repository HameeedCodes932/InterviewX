/**
 * Shared POST /interviews/{id}/complete failure classification.
 */

export type CompleteInterviewSessionErrorCode =
  | "not_found"
  | "unauthenticated"
  | "complete_failed"
  | "network";

export function mapCompleteInterviewSessionErrorCode(
  status: number | null | undefined,
): CompleteInterviewSessionErrorCode {
  if (status === 404 || status === 422) return "not_found";
  if (status === 401) return "unauthenticated";
  if (status == null) return "network";
  return "complete_failed";
}

export function messageForCompleteInterviewSessionError(
  code: CompleteInterviewSessionErrorCode,
  detailFallback?: string,
): string {
  switch (code) {
    case "not_found":
      return "Interview session not found.";
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "complete_failed":
      return detailFallback ?? "Unable to complete the interview session.";
  }
}
