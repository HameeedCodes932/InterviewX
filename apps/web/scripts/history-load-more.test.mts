/**
 * Regression checks for Interview History Load More transitions.
 * Run: npm run test:history-load-more
 */

import assert from "node:assert/strict";
import {
  beginLoadMore,
  canLoadMore,
  completeLoadMoreFailure,
  completeLoadMoreSuccess,
  completeLoadMoreUnauthenticated,
  type ReadyHistoryPage,
} from "../src/lib/interviews/historyLoadMore.ts";
import type { InterviewSession } from "../src/lib/interviews/types.ts";

function session(id: string): InterviewSession {
  return {
    id,
    user_id: "user-1",
    category: "software_engineering",
    role: "Software Engineer",
    experience_level: "mid",
    focus_areas: ["Programming & Problem Solving"],
    difficulty: "medium",
    duration_minutes: 30,
    status: "in_progress",
    completed_at: null,
    created_at: "2026-11-22T18:00:00.000Z",
    updated_at: "2026-11-22T18:00:00.000Z",
  };
}

const ready: ReadyHistoryPage = {
  items: [session("a"), session("b")],
  total: 4,
  loadingMore: false,
  loadMoreError: null,
};

assert.equal(canLoadMore(ready), true);
assert.equal(canLoadMore({ ...ready, loadingMore: true }), false);
assert.equal(canLoadMore({ ...ready, items: ready.items, total: 2 }), false);

const started = beginLoadMore(ready);
assert.ok(started);
assert.equal(started.loadingMore, true);
assert.equal(started.loadMoreError, null);
assert.deepEqual(
  started.items.map((item) => item.id),
  ["a", "b"],
);
assert.equal(beginLoadMore({ ...ready, loadingMore: true }), null);

const withPriorError: ReadyHistoryPage = {
  ...ready,
  loadMoreError: "Unable to load more interview sessions.",
};
const retryStart = beginLoadMore(withPriorError);
assert.ok(retryStart);
assert.equal(retryStart.loadMoreError, null);
assert.equal(retryStart.loadingMore, true);
assert.deepEqual(
  retryStart.items.map((item) => item.id),
  ["a", "b"],
);

const failed = completeLoadMoreFailure(
  { ...ready, loadingMore: true },
  "Unable to load more interview sessions.",
);
assert.equal(failed.loadingMore, false);
assert.equal(failed.loadMoreError, "Unable to load more interview sessions.");
assert.deepEqual(
  failed.items.map((item) => item.id),
  ["a", "b"],
);
assert.equal(failed.total, 4);

const succeeded = completeLoadMoreSuccess(
  { ...failed, loadingMore: true, loadMoreError: failed.loadMoreError },
  { items: [session("c"), session("d")], total: 4 },
);
assert.equal(succeeded.loadingMore, false);
assert.equal(succeeded.loadMoreError, null);
assert.deepEqual(
  succeeded.items.map((item) => item.id),
  ["a", "b", "c", "d"],
);

const noDupes = completeLoadMoreSuccess(
  { ...ready, loadingMore: true },
  { items: [session("b"), session("c")], total: 3 },
);
assert.deepEqual(
  noDupes.items.map((item) => item.id),
  ["a", "b", "c"],
);

const unauth = completeLoadMoreUnauthenticated({
  ...ready,
  loadingMore: true,
  loadMoreError: "stale",
});
assert.equal(unauth.loadingMore, false);
assert.equal(unauth.loadMoreError, null);
assert.deepEqual(
  unauth.items.map((item) => item.id),
  ["a", "b"],
);

console.log("history-load-more.test.mts: ok");
