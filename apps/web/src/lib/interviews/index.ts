/**
 * Interview session API helpers.
 * Uses the shared apiFetch client (Bearer token attached automatically).
 */

import { ApiError, apiFetch } from "@/lib/api";
import {
  mapGetInterviewSessionErrorCode,
  messageForGetInterviewSessionError,
} from "./getSessionError";
import type {
  InterviewSession,
  InterviewSessionCreateRequest,
} from "./types";

export type {
  Difficulty,
  DurationMinutes,
  ExperienceLevel,
  InterviewCategory,
  InterviewSession,
  InterviewSessionCreateRequest,
} from "./types";

export {
  mapGetInterviewSessionErrorCode,
  messageForGetInterviewSessionError,
} from "./getSessionError";
export type { GetInterviewSessionErrorCode } from "./getSessionError";

export class InterviewApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "InterviewApiError";
    this.code = code;
    this.status = status;
  }
}

function detailMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  }
  return fallback;
}

export async function createInterviewSession(
  input: InterviewSessionCreateRequest,
): Promise<InterviewSession> {
  try {
    return await apiFetch<InterviewSession>("/interviews", {
      method: "POST",
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new InterviewApiError(
        error.status === 401 ? "unauthenticated" : "create_failed",
        detailMessage(error.body, "Unable to create the interview session."),
        error.status,
      );
    }
    throw new InterviewApiError(
      "network",
      "Unable to reach the interview service. Is the API running?",
    );
  }
}

export async function getInterviewSession(
  sessionId: string,
): Promise<InterviewSession> {
  try {
    return await apiFetch<InterviewSession>(`/interviews/${sessionId}`);
  } catch (error) {
    if (error instanceof ApiError) {
      const code = mapGetInterviewSessionErrorCode(error.status);
      const message = messageForGetInterviewSessionError(
        code,
        detailMessage(error.body, "Unable to load the interview session."),
      );
      throw new InterviewApiError(code, message, error.status);
    }
    const code = mapGetInterviewSessionErrorCode(null);
    throw new InterviewApiError(
      code,
      messageForGetInterviewSessionError(code),
    );
  }
}
