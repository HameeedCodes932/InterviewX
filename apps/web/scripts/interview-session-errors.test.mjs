/**
 * Lightweight mapping checks for getInterviewSession error codes.
 * Mirrors apps/web/src/lib/interviews/index.ts status handling.
 * Run: node scripts/interview-session-errors.test.mjs
 */

import assert from "node:assert/strict";

function mapGetSessionError(status) {
  if (status === 404 || status === 422) return "not_found";
  if (status === 401) return "unauthenticated";
  if (status == null) return "network";
  return "fetch_failed";
}

assert.equal(mapGetSessionError(404), "not_found");
assert.equal(mapGetSessionError(422), "not_found");
assert.equal(mapGetSessionError(401), "unauthenticated");
assert.equal(mapGetSessionError(500), "fetch_failed");
assert.equal(mapGetSessionError(null), "network");

console.log("interview-session-errors.test.mjs: ok");
