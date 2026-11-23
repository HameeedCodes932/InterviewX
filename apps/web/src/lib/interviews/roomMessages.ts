/**
 * Interview room conversation helpers for persisted messages.
 */

import type { InterviewMessage, InterviewMessageSpeaker } from "./types";

export const DEFAULT_INTERVIEW_GREETING =
  "Hello! Welcome to your Software Engineering interview. Let's start by getting to know you. Could you briefly introduce yourself and tell me about your technical background?";

export type RoomMessageStatus = "saved" | "saving" | "failed";

export type RoomMessage = {
  id: string;
  clientMessageId: string;
  speaker: InterviewMessageSpeaker;
  text: string;
  status: RoomMessageStatus;
  error?: string;
};

export type TranscriptLoadStatus = "loading" | "ready" | "error";

export function mapApiMessageToRoom(message: InterviewMessage): RoomMessage {
  return {
    id: message.id,
    clientMessageId: message.client_message_id,
    speaker: message.speaker,
    text: message.content,
    status: "saved",
  };
}

export function sortRoomMessages(
  messages: RoomMessage[],
  sequences: Map<string, number>,
): RoomMessage[] {
  return [...messages].sort((left, right) => {
    const leftSeq = sequences.get(left.clientMessageId) ?? Number.MAX_SAFE_INTEGER;
    const rightSeq = sequences.get(right.clientMessageId) ?? Number.MAX_SAFE_INTEGER;
    if (leftSeq !== rightSeq) return leftSeq - rightSeq;
    return left.clientMessageId.localeCompare(right.clientMessageId);
  });
}

export function messagesFromApi(
  items: InterviewMessage[],
): RoomMessage[] {
  return items
    .slice()
    .sort((left, right) => {
      if (left.sequence !== right.sequence) return left.sequence - right.sequence;
      return left.id.localeCompare(right.id);
    })
    .map(mapApiMessageToRoom);
}

export function beginOptimisticMessage(
  messages: RoomMessage[],
  input: {
    clientMessageId: string;
    speaker: InterviewMessageSpeaker;
    text: string;
  },
): RoomMessage[] {
  return [
    ...messages,
    {
      id: `local-${input.clientMessageId}`,
      clientMessageId: input.clientMessageId,
      speaker: input.speaker,
      text: input.text,
      status: "saving",
    },
  ];
}

export function markMessageSaving(
  messages: RoomMessage[],
  clientMessageId: string,
): RoomMessage[] {
  return messages.map((message) =>
    message.clientMessageId === clientMessageId
      ? { ...message, status: "saving", error: undefined }
      : message,
  );
}

export function completeMessageSave(
  messages: RoomMessage[],
  saved: InterviewMessage,
): RoomMessage[] {
  const mapped = mapApiMessageToRoom(saved);
  let replaced = false;
  const next = messages.map((message) => {
    if (message.clientMessageId !== saved.client_message_id) return message;
    replaced = true;
    return mapped;
  });
  return replaced ? next : [...next, mapped];
}

export function failMessageSave(
  messages: RoomMessage[],
  clientMessageId: string,
  error: string,
): RoomMessage[] {
  return messages.map((message) =>
    message.clientMessageId === clientMessageId
      ? { ...message, status: "failed", error }
      : message,
  );
}

export function hasPendingSave(messages: RoomMessage[]): boolean {
  return messages.some((message) => message.status === "saving");
}

export function hasFailedSave(messages: RoomMessage[]): boolean {
  return messages.some((message) => message.status === "failed");
}

export function hasUnsavedMessages(messages: RoomMessage[]): boolean {
  return hasPendingSave(messages) || hasFailedSave(messages);
}

export type CompletionBlockReason =
  | "transcript_loading"
  | "transcript_error"
  | "sending"
  | "generating"
  | "saving"
  | "failed"
  | null;

export type CompletionGuardInput = {
  transcriptStatus: TranscriptLoadStatus;
  messages: RoomMessage[];
  /** Synchronous in-flight send lock (ref.current). */
  sendInFlight?: boolean;
  /** AI interviewer reply currently generating. */
  aiGenerating?: boolean;
};

/** Why ending an in-progress interview must wait (null = safe to complete). */
export function completionBlockReason(
  input: CompletionGuardInput,
): CompletionBlockReason {
  if (input.transcriptStatus === "loading") return "transcript_loading";
  if (input.transcriptStatus === "error") return "transcript_error";
  if (input.sendInFlight) return "sending";
  if (input.aiGenerating) return "generating";
  if (hasPendingSave(input.messages)) return "saving";
  if (hasFailedSave(input.messages)) return "failed";
  return null;
}

export function canCompleteInterview(input: CompletionGuardInput): boolean {
  return completionBlockReason(input) === null;
}

export function messageForCompletionBlock(
  reason: CompletionBlockReason,
): string | null {
  switch (reason) {
    case "transcript_loading":
      return "Wait for the conversation to finish loading before ending the interview.";
    case "transcript_error":
      return "The conversation could not be loaded. Retry loading before ending the interview.";
    case "sending":
      return "Wait for the current message to finish saving before ending the interview.";
    case "generating":
      return "Wait for the interviewer to finish responding before ending the interview.";
    case "saving":
      return "Wait for all messages to finish saving before ending the interview.";
    case "failed":
      return "One or more messages failed to save. Retry those saves before ending the interview.";
    case null:
      return null;
  }
}

export function canSubmitCandidateReply(options: {
  isCompleted: boolean;
  draft: string;
  messages: RoomMessage[];
  aiGenerating?: boolean;
}): boolean {
  if (options.isCompleted) return false;
  if (!options.draft.trim()) return false;
  if (options.aiGenerating) return false;
  if (hasPendingSave(options.messages)) return false;
  return true;
}
