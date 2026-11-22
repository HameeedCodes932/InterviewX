/**
 * Shared interview message API failure classification.
 */

export type ListInterviewMessagesErrorCode =
  | "not_found"
  | "unauthenticated"
  | "list_failed"
  | "network";

export type CreateInterviewMessageErrorCode =
  | "not_found"
  | "unauthenticated"
  | "completed"
  | "invalid"
  | "create_failed"
  | "network";

export function mapListInterviewMessagesErrorCode(
  status: number | null | undefined,
): ListInterviewMessagesErrorCode {
  if (status === 404 || status === 422) return "not_found";
  if (status === 401) return "unauthenticated";
  if (status == null) return "network";
  return "list_failed";
}

export function messageForListInterviewMessagesError(
  code: ListInterviewMessagesErrorCode,
  detailFallback?: string,
): string {
  switch (code) {
    case "not_found":
      return "Interview session not found.";
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "list_failed":
      return detailFallback ?? "Unable to load the conversation.";
  }
}

export function mapCreateInterviewMessageErrorCode(
  status: number | null | undefined,
): CreateInterviewMessageErrorCode {
  if (status === 404 || status === 422) {
    // 422 is usually validation; treat path UUID 422 as not_found only when
    // callers pass path errors — body validation also 422 → invalid.
    return status === 404 ? "not_found" : "invalid";
  }
  if (status === 401) return "unauthenticated";
  if (status === 409) return "completed";
  if (status == null) return "network";
  return "create_failed";
}

export function messageForCreateInterviewMessageError(
  code: CreateInterviewMessageErrorCode,
  detailFallback?: string,
): string {
  switch (code) {
    case "not_found":
      return "Interview session not found.";
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "completed":
      return "This interview is completed and can no longer accept messages.";
    case "invalid":
      return detailFallback ?? "That message could not be saved.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "create_failed":
      return detailFallback ?? "Unable to save the message.";
  }
}
