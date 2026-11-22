/**
 * Interview session API helpers.
 * Uses the shared apiFetch client (Bearer token attached automatically).
 */

import { ApiError, apiFetch } from "@/lib/api";
import {
  mapCompleteInterviewSessionErrorCode,
  messageForCompleteInterviewSessionError,
} from "./completeSessionError";
import {
  mapGetInterviewSessionErrorCode,
  messageForGetInterviewSessionError,
} from "./getSessionError";
import {
  mapListInterviewSessionsErrorCode,
  messageForListInterviewSessionsError,
} from "./listSessionError";
import { buildListInterviewSessionsPath } from "./listSessionsPath";
import {
  mapCreateInterviewMessageErrorCode,
  mapListInterviewMessagesErrorCode,
  messageForCreateInterviewMessageError,
  messageForListInterviewMessagesError,
} from "./messageError";
import type {
  InterviewMessage,
  InterviewMessageCreateRequest,
  InterviewMessageListResponse,
  InterviewSession,
  InterviewSessionCreateRequest,
  InterviewSessionListResponse,
  ListInterviewSessionsParams,
} from "./types";

export type {
  Difficulty,
  DurationMinutes,
  ExperienceLevel,
  InterviewCategory,
  InterviewMessage,
  InterviewMessageCreateRequest,
  InterviewMessageListResponse,
  InterviewMessageSpeaker,
  InterviewSession,
  InterviewSessionCreateRequest,
  InterviewSessionListResponse,
  InterviewSessionStatus,
  ListInterviewSessionsParams,
} from "./types";

export {
  mapGetInterviewSessionErrorCode,
  messageForGetInterviewSessionError,
} from "./getSessionError";
export type { GetInterviewSessionErrorCode } from "./getSessionError";
export {
  mapCompleteInterviewSessionErrorCode,
  messageForCompleteInterviewSessionError,
} from "./completeSessionError";
export type { CompleteInterviewSessionErrorCode } from "./completeSessionError";
export {
  mapListInterviewSessionsErrorCode,
  messageForListInterviewSessionsError,
} from "./listSessionError";
export type { ListInterviewSessionsErrorCode } from "./listSessionError";
export {
  categoryLabel,
  difficultyLabel,
  durationLabel,
  formatSessionDate,
  sessionOpenHref,
  statusLabel,
} from "./display";
export { buildListInterviewSessionsPath } from "./listSessionsPath";
export {
  beginLoadMore,
  canLoadMore,
  completeLoadMoreFailure,
  completeLoadMoreSuccess,
  completeLoadMoreUnauthenticated,
  runHistoryLoadMore,
} from "./historyLoadMore";
export type {
  LoadMoreInFlightLock,
  ReadyHistoryPage,
  RunHistoryLoadMoreDeps,
} from "./historyLoadMore";
export {
  mapCreateInterviewMessageErrorCode,
  mapListInterviewMessagesErrorCode,
  messageForCreateInterviewMessageError,
  messageForListInterviewMessagesError,
} from "./messageError";
export type {
  CreateInterviewMessageErrorCode,
  ListInterviewMessagesErrorCode,
} from "./messageError";
export {
  greetingClientMessageId,
  newClientMessageId,
  stableClientMessageId,
} from "./clientMessageId";
export {
  DEFAULT_INTERVIEW_GREETING,
  beginOptimisticMessage,
  canCompleteInterview,
  canSubmitCandidateReply,
  completeMessageSave,
  completionBlockReason,
  failMessageSave,
  hasFailedSave,
  hasPendingSave,
  hasUnsavedMessages,
  mapApiMessageToRoom,
  markMessageSaving,
  messageForCompletionBlock,
  messagesFromApi,
} from "./roomMessages";
export type {
  CompletionBlockReason,
  RoomMessage,
  RoomMessageStatus,
} from "./roomMessages";

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

export async function listInterviewSessions(
  params: ListInterviewSessionsParams = {},
): Promise<InterviewSessionListResponse> {
  const path = buildListInterviewSessionsPath(params);

  try {
    // Explicit GET — must match FastAPI `GET /api/v1/interviews` (not POST create).
    return await apiFetch<InterviewSessionListResponse>(path, {
      method: "GET",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const code = mapListInterviewSessionsErrorCode(error.status);
      const message = messageForListInterviewSessionsError(
        code,
        detailMessage(error.body, "Unable to load interview history."),
      );
      throw new InterviewApiError(code, message, error.status);
    }
    const code = mapListInterviewSessionsErrorCode(null);
    throw new InterviewApiError(
      code,
      messageForListInterviewSessionsError(code),
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

export async function completeInterviewSession(
  sessionId: string,
): Promise<InterviewSession> {
  try {
    return await apiFetch<InterviewSession>(
      `/interviews/${sessionId}/complete`,
      { method: "POST" },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const code = mapCompleteInterviewSessionErrorCode(error.status);
      const message = messageForCompleteInterviewSessionError(
        code,
        detailMessage(error.body, "Unable to complete the interview session."),
      );
      throw new InterviewApiError(code, message, error.status);
    }
    const code = mapCompleteInterviewSessionErrorCode(null);
    throw new InterviewApiError(
      code,
      messageForCompleteInterviewSessionError(code),
    );
  }
}

export async function listInterviewMessages(
  sessionId: string,
): Promise<InterviewMessageListResponse> {
  try {
    return await apiFetch<InterviewMessageListResponse>(
      `/interviews/${sessionId}/messages`,
      { method: "GET" },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const code = mapListInterviewMessagesErrorCode(error.status);
      const message = messageForListInterviewMessagesError(
        code,
        detailMessage(error.body, "Unable to load the conversation."),
      );
      throw new InterviewApiError(code, message, error.status);
    }
    const code = mapListInterviewMessagesErrorCode(null);
    throw new InterviewApiError(
      code,
      messageForListInterviewMessagesError(code),
    );
  }
}

export async function createInterviewMessage(
  sessionId: string,
  input: InterviewMessageCreateRequest,
): Promise<InterviewMessage> {
  try {
    return await apiFetch<InterviewMessage>(
      `/interviews/${sessionId}/messages`,
      { method: "POST", body: input },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const code = mapCreateInterviewMessageErrorCode(error.status);
      const message = messageForCreateInterviewMessageError(
        code,
        detailMessage(error.body, "Unable to save the message."),
      );
      throw new InterviewApiError(code, message, error.status);
    }
    const code = mapCreateInterviewMessageErrorCode(null);
    throw new InterviewApiError(
      code,
      messageForCreateInterviewMessageError(code),
    );
  }
}
