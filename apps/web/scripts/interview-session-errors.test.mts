/**
 * Regression checks against the production GET-session error mapper.
 * Imports the same helper used by apps/web/src/lib/interviews/index.ts.
 *
 * Run: npm run test:interview-errors
 */

import assert from "node:assert/strict";
import {
  mapGetInterviewSessionErrorCode,
  messageForGetInterviewSessionError,
} from "../src/lib/interviews/getSessionError.ts";

assert.equal(mapGetInterviewSessionErrorCode(404), "not_found");
assert.equal(mapGetInterviewSessionErrorCode(422), "not_found");
assert.equal(mapGetInterviewSessionErrorCode(401), "unauthenticated");
assert.equal(mapGetInterviewSessionErrorCode(500), "fetch_failed");
assert.equal(mapGetInterviewSessionErrorCode(null), "network");
assert.equal(mapGetInterviewSessionErrorCode(undefined), "network");

assert.equal(
  messageForGetInterviewSessionError("not_found"),
  "Interview session not found.",
);
assert.equal(
  messageForGetInterviewSessionError("unauthenticated"),
  "Your session expired. Please sign in again.",
);
assert.match(
  messageForGetInterviewSessionError("network"),
  /Unable to reach the interview service/,
);
assert.equal(
  messageForGetInterviewSessionError("fetch_failed"),
  "Unable to load the interview session.",
);

// Room behavior contract: not_found must not be confused with network/retry.
assert.notEqual(mapGetInterviewSessionErrorCode(422), "network");
assert.notEqual(mapGetInterviewSessionErrorCode(422), "fetch_failed");
assert.equal(mapGetInterviewSessionErrorCode(null), "network");

console.log("interview-session-errors.test.mts: ok (production helper)");
