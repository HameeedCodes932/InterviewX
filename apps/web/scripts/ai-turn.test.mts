/**
 * AI interviewer turn helpers.
 * Run: npm run test:ai-turn
 */

import assert from "node:assert/strict";
import {
  beginAiGeneration,
  canRequestAiTurn,
  completeAiGeneration,
  failAiGeneration,
  isAiGenerating,
} from "../src/lib/interviews/aiTurn.ts";
import {
  mapRespondInterviewErrorCode,
  messageForRespondInterviewError,
} from "../src/lib/interviews/respondError.ts";
import {
  canCompleteInterview,
  canSubmitCandidateReply,
  completionBlockReason,
  messageForCompletionBlock,
} from "../src/lib/interviews/roomMessages.ts";

const candidateId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

assert.equal(isAiGenerating({ status: "idle" }), false);
assert.equal(
  isAiGenerating(beginAiGeneration(candidateId)),
  true,
);

const generating = beginAiGeneration(candidateId);
assert.equal(generating.status, "generating");
assert.equal(generating.candidateClientMessageId, candidateId);

const failed = failAiGeneration(candidateId, "Provider down");
assert.equal(failed.status, "error");
assert.equal(failed.candidateClientMessageId, candidateId);
assert.match(failed.message, /Provider down/);

assert.deepEqual(completeAiGeneration(), { status: "idle" });

assert.equal(
  canRequestAiTurn({ isCompleted: false, aiTurn: { status: "idle" } }),
  true,
);
assert.equal(
  canRequestAiTurn({
    isCompleted: false,
    aiTurn: beginAiGeneration(candidateId),
  }),
  false,
);
assert.equal(
  canRequestAiTurn({ isCompleted: true, aiTurn: { status: "idle" } }),
  false,
);

assert.equal(mapRespondInterviewErrorCode(503), "not_configured");
assert.equal(mapRespondInterviewErrorCode(429), "rate_limited");
assert.equal(mapRespondInterviewErrorCode(502), "provider");
assert.equal(mapRespondInterviewErrorCode(401), "unauthenticated");
assert.match(messageForRespondInterviewError("not_configured"), /not configured/i);

const readyMessages = [
  {
    id: "m1",
    clientMessageId: candidateId,
    speaker: "candidate" as const,
    text: "Answer",
    status: "saved" as const,
  },
];

assert.equal(
  canSubmitCandidateReply({
    isCompleted: false,
    draft: "Next",
    messages: readyMessages,
    aiGenerating: true,
  }),
  false,
);
assert.equal(
  canSubmitCandidateReply({
    isCompleted: false,
    draft: "Next",
    messages: readyMessages,
    aiGenerating: false,
  }),
  true,
);
assert.equal(
  canSubmitCandidateReply({
    isCompleted: true,
    draft: "Next",
    messages: readyMessages,
    aiGenerating: false,
  }),
  false,
);

assert.equal(
  completionBlockReason({
    transcriptStatus: "ready",
    messages: readyMessages,
    aiGenerating: true,
  }),
  "generating",
);
assert.equal(
  canCompleteInterview({
    transcriptStatus: "ready",
    messages: readyMessages,
    aiGenerating: true,
  }),
  false,
);
assert.match(
  messageForCompletionBlock("generating") ?? "",
  /interviewer to finish/i,
);

// Candidate save-before-AI contract: helpers treat save and AI as separate states.
assert.equal(isAiGenerating({ status: "idle" }), false);
assert.equal(
  beginAiGeneration(candidateId).candidateClientMessageId,
  failAiGeneration(candidateId, "x").candidateClientMessageId,
);

console.log("ai-turn.test.mts: ok");
