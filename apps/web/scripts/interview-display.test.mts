/**
 * Regression checks for interview history display helpers.
 * Run: npm run test:interview-display
 */

import assert from "node:assert/strict";
import {
  categoryLabel,
  difficultyLabel,
  durationLabel,
  formatSessionDate,
  sessionOpenHref,
  statusLabel,
} from "../src/lib/interviews/display.ts";
import {
  mapListInterviewSessionsErrorCode,
  messageForListInterviewSessionsError,
} from "../src/lib/interviews/listSessionError.ts";

assert.equal(categoryLabel("software_engineering"), "Software Engineering");
assert.equal(statusLabel("in_progress"), "In Progress");
assert.equal(statusLabel("completed"), "Completed");
assert.equal(difficultyLabel("medium"), "Medium");
assert.equal(durationLabel(30), "30 min");
assert.equal(
  sessionOpenHref({ id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }),
  "/interview/room/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
);
assert.match(formatSessionDate("2026-11-22T18:00:00.000Z"), /2026/);

assert.equal(mapListInterviewSessionsErrorCode(401), "unauthenticated");
assert.equal(mapListInterviewSessionsErrorCode(500), "list_failed");
assert.equal(mapListInterviewSessionsErrorCode(null), "network");
assert.match(
  messageForListInterviewSessionsError("network"),
  /Unable to reach the interview service/,
);

console.log("interview-display.test.mts: ok");
