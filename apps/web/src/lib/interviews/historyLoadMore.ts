/**
 * Pure Load More transitions for Interview History.
 * Keeps already-loaded sessions visible when a later page fails.
 */

import type { InterviewSession } from "./types";

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
