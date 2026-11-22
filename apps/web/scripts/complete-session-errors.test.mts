/**
 * Regression checks against the production complete-session error mapper.
 * Run: npm run test:complete-errors
 */

import assert from "node:assert/strict";
import {
  mapCompleteInterviewSessionErrorCode,
  messageForCompleteInterviewSessionError,
} from "../src/lib/interviews/completeSessionError.ts";

assert.equal(mapCompleteInterviewSessionErrorCode(404), "not_found");
assert.equal(mapCompleteInterviewSessionErrorCode(422), "not_found");
assert.equal(mapCompleteInterviewSessionErrorCode(401), "unauthenticated");
assert.equal(mapCompleteInterviewSessionErrorCode(500), "complete_failed");
assert.equal(mapCompleteInterviewSessionErrorCode(null), "network");

assert.equal(
  messageForCompleteInterviewSessionError("not_found"),
  "Interview session not found.",
);
assert.match(
  messageForCompleteInterviewSessionError("network"),
  /Unable to reach the interview service/,
);

console.log("complete-session-errors.test.mts: ok (production helper)");
