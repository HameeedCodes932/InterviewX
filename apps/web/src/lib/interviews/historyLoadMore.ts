/**
 * Load More transitions + request orchestration for Interview History.
 * Keeps already-loaded sessions visible when a later page fails.
 *
 * Request triggering uses a synchronous in-flight lock and reads offset from a
 * ready snapshot *before* any React state update (never inside a setState updater).
 */

import type {
  InterviewSession,
  InterviewSessionListResponse,
} from "./types";

export type ReadyHistoryPage = {
  items: InterviewSession[];
  total: number;
  loadingMore: boolean;
  loadMoreError: string | null;
};

export function canLoadMore(state: ReadyHistoryPage): boolean {
  return !state.loadingMore && state.items.length < state.total;
}

/** Start a Load More request; clears any prior inline error. */
export function beginLoadMore(
  state: ReadyHistoryPage,
): ReadyHistoryPage | null {
  if (!canLoadMore(state)) return null;
  return {
    ...state,
    loadingMore: true,
    loadMoreError: null,
  };
}

/** Append the next page without duplicating already-loaded sessions. */
export function completeLoadMoreSuccess(
  state: ReadyHistoryPage,
  page: { items: InterviewSession[]; total: number },
): ReadyHistoryPage {
  const seen = new Set(state.items.map((item) => item.id));
  const appended = page.items.filter((item) => !seen.has(item.id));
  return {
    ...state,
    items: [...state.items, ...appended],
    total: page.total,
    loadingMore: false,
    loadMoreError: null,
  };
}

/** Keep existing sessions; show an inline Load More error. */
export function completeLoadMoreFailure(
  state: ReadyHistoryPage,
  message: string,
): ReadyHistoryPage {
  return {
    ...state,
    loadingMore: false,
    loadMoreError: message,
  };
}

/** Reset loading flag after an auth failure before redirecting. */
export function completeLoadMoreUnauthenticated(
  state: ReadyHistoryPage,
): ReadyHistoryPage {
  return {
    ...state,
    loadingMore: false,
    loadMoreError: null,
  };
}

export type LoadMoreInFlightLock = { current: boolean };

export type RunHistoryLoadMoreDeps = {
  pageSize: number;
  inFlight: LoadMoreInFlightLock;
  /** Latest ready page, or null when history is not in the ready state. */
  getReadySnapshot: () => ReadyHistoryPage | null;
  /** Pure-ready updater; the component wraps this into setLoad. */
  setReady: (updater: (prev: ReadyHistoryPage) => ReadyHistoryPage) => void;
  listSessions: (params: {
    limit: number;
    offset: number;
  }) => Promise<InterviewSessionListResponse>;
  isUnauthenticated: (error: unknown) => boolean;
  onUnauthenticated: () => void;
  mapError: (error: unknown) => string;
};

/**
 * Starts the next-page request when allowed.
 * Returns true when a network request was started.
 */
export async function runHistoryLoadMore(
  deps: RunHistoryLoadMoreDeps,
): Promise<boolean> {
  if (deps.inFlight.current) return false;

  const snapshot = deps.getReadySnapshot();
  if (!snapshot) return false;
  if (snapshot.items.length >= snapshot.total) return false;

  const offset = snapshot.items.length;

  deps.inFlight.current = true;
  deps.setReady((prev) => ({
    ...prev,
    loadingMore: true,
    loadMoreError: null,
  }));

  try {
    const payload = await deps.listSessions({
      limit: deps.pageSize,
      offset,
    });
    deps.setReady((prev) => completeLoadMoreSuccess(prev, payload));
    return true;
  } catch (error: unknown) {
    if (deps.isUnauthenticated(error)) {
      deps.setReady((prev) => completeLoadMoreUnauthenticated(prev));
      deps.onUnauthenticated();
      return true;
    }
    deps.setReady((prev) =>
      completeLoadMoreFailure(prev, deps.mapError(error)),
    );
    return true;
  } finally {
    deps.inFlight.current = false;
  }
}
