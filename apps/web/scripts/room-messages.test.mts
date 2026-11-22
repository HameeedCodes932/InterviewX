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
  canSubmitCandidateReply,
  completeMessageSave,
  failMessageSave,
  hasPendingSave,
  markMessageSaving,
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

console.log("room-messages.test.mts: ok");
