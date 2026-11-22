/**
 * Regression: Load More must invoke the list API with the correct offset.
 * Does not rely only on pure state helpers — exercises runHistoryLoadMore.
 * Run: npm run test:run-history-load-more
 */

import assert from "node:assert/strict";
import {
  runHistoryLoadMore,
  type ReadyHistoryPage,
} from "../src/lib/interviews/historyLoadMore.ts";
import type {
  InterviewSession,
  InterviewSessionListResponse,
} from "../src/lib/interviews/types.ts";

function unauthenticatedError() {
  const error = new Error("Not authenticated.") as Error & {
    code: string;
    status: number;
  };
  error.code = "unauthenticated";
  error.status = 401;
  return error;
}

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

function createHarness(initial: ReadyHistoryPage) {
  let ready = structuredClone(initial);
  const calls: Array<{ limit: number; offset: number }> = [];
  const redirects: string[] = [];
  let listImpl: (params: {
    limit: number;
    offset: number;
  }) => Promise<InterviewSessionListResponse> = async () => ({
    items: [],
    total: initial.total,
    limit: 10,
    offset: 0,
  });

  const inFlight = { current: false };

  const deps = {
    pageSize: 10,
    inFlight,
    getReadySnapshot: () => ready,
    setReady: (updater: (prev: ReadyHistoryPage) => ReadyHistoryPage) => {
      ready = updater(ready);
    },
    listSessions: async (params: { limit: number; offset: number }) => {
      calls.push(params);
      return listImpl(params);
    },
    isUnauthenticated: (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code === "unauthenticated",
      ),
    onUnauthenticated: () => {
      redirects.push("/login");
    },
    mapError: (error: unknown) =>
      error instanceof Error ? error.message : "Unable to load more.",
  };

  return {
    get ready() {
      return ready;
    },
    calls,
    redirects,
    inFlight,
    setListImpl(impl: typeof listImpl) {
      listImpl = impl;
    },
    run: () => runHistoryLoadMore(deps),
  };
}

const pageOne: ReadyHistoryPage = {
  items: [session("a"), session("b")],
  total: 4,
  loadingMore: false,
  loadMoreError: null,
};

// 1) Clicking Load More invokes the API with offset = loaded count
{
  const h = createHarness(pageOne);
  h.setListImpl(async ({ offset }) => ({
    items: [session("c"), session("d")],
    total: 4,
    limit: 10,
    offset,
  }));
  const started = await h.run();
  assert.equal(started, true);
  assert.deepEqual(h.calls, [{ limit: 10, offset: 2 }]);
  assert.deepEqual(
    h.ready.items.map((item) => item.id),
    ["a", "b", "c", "d"],
  );
  assert.equal(h.ready.loadingMore, false);
  assert.equal(h.ready.loadMoreError, null);
  assert.equal(h.inFlight.current, false);
}

// 2) Duplicate concurrent clicks → only one request
{
  const h = createHarness(pageOne);
  let release!: (value: InterviewSessionListResponse) => void;
  h.setListImpl(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );

  const first = h.run();
  const second = h.run();
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0], { limit: 10, offset: 2 });

  release({
    items: [session("c")],
    total: 3,
    limit: 10,
    offset: 2,
  });
  assert.equal(await first, true);
  assert.equal(await second, false);
  assert.equal(h.calls.length, 1);
  assert.equal(h.inFlight.current, false);
}

// 3) Failed request preserves loaded sessions + inline error
{
  const h = createHarness(pageOne);
  h.setListImpl(async () => {
    throw new Error("Network down");
  });
  await h.run();
  assert.deepEqual(h.calls, [{ limit: 10, offset: 2 }]);
  assert.deepEqual(
    h.ready.items.map((item) => item.id),
    ["a", "b"],
  );
  assert.equal(h.ready.loadMoreError, "Network down");
  assert.equal(h.ready.loadingMore, false);
  assert.equal(h.inFlight.current, false);
}

// 4) Retry requests the same next-page offset, then appends without duplicates
{
  const h = createHarness({
    ...pageOne,
    loadMoreError: "Network down",
  });
  h.setListImpl(async () => {
    throw new Error("still failing");
  });
  await h.run();
  assert.deepEqual(h.calls[0], { limit: 10, offset: 2 });
  assert.equal(h.ready.loadMoreError, "still failing");

  h.setListImpl(async ({ offset }) => ({
    items: [session("b"), session("c")],
    total: 3,
    limit: 10,
    offset,
  }));
  await h.run();
  assert.deepEqual(h.calls[1], { limit: 10, offset: 2 });
  assert.deepEqual(
    h.ready.items.map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.equal(h.ready.loadMoreError, null);
  assert.equal(h.ready.loadingMore, false);
}

// 5) 401 redirects to login and resets loading / lock
{
  const h = createHarness(pageOne);
  h.setListImpl(async () => {
    throw unauthenticatedError();
  });
  await h.run();
  assert.deepEqual(h.redirects, ["/login"]);
  assert.equal(h.ready.loadingMore, false);
  assert.equal(h.ready.loadMoreError, null);
  assert.deepEqual(
    h.ready.items.map((item) => item.id),
    ["a", "b"],
  );
  assert.equal(h.inFlight.current, false);
}

// 6) No request when already showing all sessions
{
  const h = createHarness({
    items: [session("a"), session("b")],
    total: 2,
    loadingMore: false,
    loadMoreError: null,
  });
  const started = await h.run();
  assert.equal(started, false);
  assert.equal(h.calls.length, 0);
}

console.log("run-history-load-more.test.mts: ok");
