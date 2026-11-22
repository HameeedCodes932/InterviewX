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

export function canSubmitCandidateReply(options: {
  isCompleted: boolean;
  draft: string;
  messages: RoomMessage[];
}): boolean {
  if (options.isCompleted) return false;
  if (!options.draft.trim()) return false;
  if (hasPendingSave(options.messages)) return false;
  return true;
}
