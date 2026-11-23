/**
 * Map AI respond endpoint failures to stable codes + user-facing copy.
 */

export type RespondInterviewErrorCode =
  | "unauthenticated"
  | "not_found"
  | "invalid"
  | "completed"
  | "not_configured"
  | "rate_limited"
  | "provider"
  | "network"
  | "unknown";

export function mapRespondInterviewErrorCode(
  status: number | null | undefined,
): RespondInterviewErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "invalid";
  if (status === 409) return "completed";
  if (status === 503) return "not_configured";
  if (status === 429) return "rate_limited";
  if (status === 502) return "provider";
  if (status == null) return "network";
  return "unknown";
}

export function messageForRespondInterviewError(
  code: RespondInterviewErrorCode,
  detail?: string,
): string {
  if (detail && detail.trim()) return detail.trim();
  switch (code) {
    case "unauthenticated":
      return "Your session expired. Please sign in again.";
    case "not_found":
      return "That interview turn could not be found.";
    case "invalid":
      return "Unable to generate an interviewer response for this message.";
    case "completed":
      return "This interview is completed and no longer accepts AI responses.";
    case "not_configured":
      return "AI interviewer is not configured on the server yet.";
    case "rate_limited":
      return "The AI interviewer is rate-limited right now. Please wait and retry.";
    case "provider":
      return "The AI interviewer is temporarily unavailable. Please retry.";
    case "network":
      return "Unable to reach the interview service. Is the API running?";
    case "unknown":
      return "Unable to generate the interviewer response. Please try again.";
  }
}
