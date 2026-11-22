/**
 * Interview room persistence helpers.
 * Run: npm run test:room-messages
 */

import assert from "node:assert/strict";
import {
  greetingClientMessageId,
  stableClientMessageId,
} from "../src/lib/interviews/clientMessageId.ts";
import {
  mapCreateInterviewMessageErrorCode,
  mapListInterviewMessagesErrorCode,
  messageForCreateInterviewMessageError,
} from "../src/lib/interviews/messageError.ts";
import {
  beginOptimisticMessage,
  canCompleteInterview,
  canSubmitCandidateReply,
  completeMessageSave,
  completionBlockReason,
  failMessageSave,
  hasFailedSave,
  hasPendingSave,
  hasUnsavedMessages,
  markMessageSaving,
  messageForCompletionBlock,
  messagesFromApi,
} from "../src/lib/interviews/roomMessages.ts";
import type { InterviewMessage } from "../src/lib/interviews/types.ts";

const sessionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

assert.equal(
  greetingClientMessageId(sessionId),
  greetingClientMessageId(sessionId),
);
assert.notEqual(
  greetingClientMessageId(sessionId),
  stableClientMessageId(sessionId, "other"),
);

const apiItems: InterviewMessage[] = [
  {
    id: "m2",
    session_id: sessionId,
    speaker: "candidate",
    content: "Answer",
    sequence: 2,
    client_message_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    created_at: "2026-11-23T10:00:01.000Z",
  },
  {
    id: "m1",
    session_id: sessionId,
    speaker: "interviewer",
    content: "Question",
    sequence: 1,
    client_message_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    created_at: "2026-11-23T10:00:00.000Z",
  },
];

const ordered = messagesFromApi(apiItems);
assert.deepEqual(
  ordered.map((item) => item.text),
  ["Question", "Answer"],
);
assert.equal(ordered[0]?.status, "saved");

let messages = beginOptimisticMessage(ordered, {
  clientMessageId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  speaker: "candidate",
  text: "Follow-up answer",
});
assert.equal(messages.at(-1)?.status, "saving");
assert.equal(hasPendingSave(messages), true);
assert.equal(
  canSubmitCandidateReply({
    isCompleted: false,
    draft: "Another",
    messages,
  }),
  false,
);

messages = failMessageSave(
  messages,
  "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "Network down",
);
assert.equal(messages.at(-1)?.status, "failed");
assert.equal(messages.at(-1)?.error, "Network down");
assert.equal(hasPendingSave(messages), false);
assert.deepEqual(
  messages.map((item) => item.text),
  ["Question", "Answer", "Follow-up answer"],
);

messages = markMessageSaving(messages, "dddddddd-dddd-dddd-dddd-dddddddddddd");
assert.equal(messages.at(-1)?.status, "saving");

const saved: InterviewMessage = {
  id: "m3",
  session_id: sessionId,
  speaker: "candidate",
  content: "Follow-up answer",
  sequence: 3,
  client_message_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  created_at: "2026-11-23T10:00:02.000Z",
};
messages = completeMessageSave(messages, saved);
assert.equal(messages.at(-1)?.id, "m3");
assert.equal(messages.at(-1)?.status, "saved");
assert.equal(messages.filter((item) => item.clientMessageId === saved.client_message_id).length, 1);

assert.equal(mapListInterviewMessagesErrorCode(401), "unauthenticated");
assert.equal(mapListInterviewMessagesErrorCode(404), "not_found");
assert.equal(mapCreateInterviewMessageErrorCode(409), "completed");
assert.equal(mapCreateInterviewMessageErrorCode(422), "invalid");
assert.match(
  messageForCreateInterviewMessageError("completed"),
  /completed/i,
);

assert.equal(
  canSubmitCandidateReply({
    isCompleted: true,
    draft: "Hi",
    messages: ordered,
  }),
  false,
);
assert.equal(
  canSubmitCandidateReply({
    isCompleted: false,
    draft: "  ",
    messages: ordered,
  }),
  false,
);
assert.equal(
  canSubmitCandidateReply({
    isCompleted: false,
    draft: "Ready",
    messages: ordered,
  }),
  true,
);

// Completion must wait for transcript readiness, in-flight send, and saves.
const readyGuard = {
  transcriptStatus: "ready" as const,
  messages: ordered,
  sendInFlight: false,
};
assert.equal(canCompleteInterview(readyGuard), true);
assert.equal(completionBlockReason(readyGuard), null);

assert.equal(
  completionBlockReason({
    transcriptStatus: "loading",
    messages: ordered,
    sendInFlight: false,
  }),
  "transcript_loading",
);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "loading",
    messages: ordered,
  }),
  false,
);
assert.match(
  messageForCompletionBlock("transcript_loading") ?? "",
  /finish loading/i,
);

assert.equal(
  completionBlockReason({
    transcriptStatus: "error",
    messages: ordered,
    sendInFlight: false,
  }),
  "transcript_error",
);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "error",
    messages: ordered,
  }),
  false,
);
assert.match(
  messageForCompletionBlock("transcript_error") ?? "",
  /could not be loaded/i,
);

assert.equal(
  completionBlockReason({
    transcriptStatus: "ready",
    messages: ordered,
    sendInFlight: true,
  }),
  "sending",
);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "ready",
    messages: ordered,
    sendInFlight: true,
  }),
  false,
);
assert.match(
  messageForCompletionBlock("sending") ?? "",
  /current message to finish saving/i,
);

const savingOnly = beginOptimisticMessage(ordered, {
  clientMessageId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  speaker: "candidate",
  text: "Still saving",
});
assert.equal(
  completionBlockReason({
    transcriptStatus: "ready",
    messages: savingOnly,
    sendInFlight: false,
  }),
  "saving",
);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "ready",
    messages: savingOnly,
  }),
  false,
);
assert.equal(hasUnsavedMessages(savingOnly), true);
assert.match(
  messageForCompletionBlock("saving") ?? "",
  /finish saving/i,
);

const failedOnly = failMessageSave(
  savingOnly,
  "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "Network down",
);
assert.equal(
  completionBlockReason({
    transcriptStatus: "ready",
    messages: failedOnly,
  }),
  "failed",
);
assert.equal(hasFailedSave(failedOnly), true);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "ready",
    messages: failedOnly,
  }),
  false,
);
assert.match(
  messageForCompletionBlock("failed") ?? "",
  /failed to save/i,
);

// Transcript loading takes precedence over save failures.
assert.equal(
  completionBlockReason({
    transcriptStatus: "loading",
    messages: failedOnly,
    sendInFlight: true,
  }),
  "transcript_loading",
);

const recovered = completeMessageSave(failedOnly, {
  id: "m4",
  session_id: sessionId,
  speaker: "candidate",
  content: "Still saving",
  sequence: 4,
  client_message_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  created_at: "2026-11-23T10:00:03.000Z",
});
assert.equal(
  canCompleteInterview({
    transcriptStatus: "ready",
    messages: recovered,
    sendInFlight: false,
  }),
  true,
);
assert.equal(
  completionBlockReason({
    transcriptStatus: "ready",
    messages: recovered,
  }),
  null,
);

console.log("room-messages.test.mts: ok");
