"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  InterviewApiError,
  beginLoadMore,
  completeLoadMoreFailure,
  completeLoadMoreSuccess,
  completeLoadMoreUnauthenticated,
  listInterviewSessions,
  type InterviewSession,
} from "@/lib/interviews";
import { SessionHistoryCard } from "./SessionHistoryCard";

const PAGE_SIZE = 10;

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      items: InterviewSession[];
      total: number;
      loadingMore: boolean;
      loadMoreError: string | null;
    }
  | { status: "empty" }
  | { status: "error"; message: string };

function loadMoreErrorMessage(error: unknown): string {
  if (error instanceof InterviewApiError) return error.message;
  return "Unable to load more interview sessions.";
}

export function InterviewHistory() {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);
  const [trackedRetry, setTrackedRetry] = useState(0);

  if (retryToken !== trackedRetry) {
    setTrackedRetry(retryToken);
    setLoad({ status: "loading" });
  }

  useEffect(() => {
    let cancelled = false;

    listInterviewSessions({ limit: PAGE_SIZE, offset: 0 })
      .then((payload) => {
        if (cancelled) return;
        if (payload.items.length === 0) {
          setLoad({ status: "empty" });
          return;
        }
        setLoad({
          status: "ready",
          items: payload.items,
          total: payload.total,
          loadingMore: false,
          loadMoreError: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (
          error instanceof InterviewApiError &&
          error.code === "unauthenticated"
        ) {
          router.replace("/login");
          return;
        }
        setLoad({
          status: "error",
          message:
            error instanceof InterviewApiError
              ? error.message
              : "Unable to load interview history.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken, router]);

  async function loadMore() {
    let offset = 0;
    let started = false;

    setLoad((prev) => {
      if (prev.status !== "ready") return prev;
      const next = beginLoadMore(prev);
      if (!next) return prev;
      started = true;
      offset = next.items.length;
      return { status: "ready", ...next };
    });

    if (!started) return;

    try {
      const payload = await listInterviewSessions({
        limit: PAGE_SIZE,
        offset,
      });
      setLoad((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          status: "ready",
          ...completeLoadMoreSuccess(prev, payload),
        };
      });
    } catch (error: unknown) {
      if (
        error instanceof InterviewApiError &&
        error.code === "unauthenticated"
      ) {
        setLoad((prev) => {
          if (prev.status !== "ready") return prev;
          return {
            status: "ready",
            ...completeLoadMoreUnauthenticated(prev),
          };
        });
        router.replace("/login");
        return;
      }
      setLoad((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          status: "ready",
          ...completeLoadMoreFailure(prev, loadMoreErrorMessage(error)),
        };
      });
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5" aria-labelledby="history-heading">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/55">
          Interview history
        </p>
        <h1
          id="history-heading"
          className="mt-1.5 font-display text-[1.75rem] tracking-tight text-ix-graphite sm:text-[2rem]"
        >
          Your practice sessions
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
          Browse configurations you have started with InterviewX. Opening a
          session restores its setup details only — conversation transcripts are
          not persisted yet.
        </p>
      </div>

      {load.status === "loading" ? (
        <p className="text-sm text-ix-charcoal/55">Loading interview history…</p>
      ) : null}

      {load.status === "empty" ? (
        <div className="ix-dash-panel">
          <p className="font-display text-xl tracking-tight text-ix-graphite">
            No interviews yet
          </p>
          <p className="mt-2 max-w-xl text-sm text-ix-charcoal/65">
            When you start a practice interview, it will appear here with its
            role, difficulty, duration, and status.
          </p>
          <Link
            href="/interview/setup"
            className="ix-btn-primary mt-5 !w-auto px-5"
          >
            Start your first interview
          </Link>
        </div>
      ) : null}

      {load.status === "error" ? (
        <div className="ix-dash-panel border border-[#d8c2c2] bg-[#fbf5f5]">
          <p className="text-sm text-red-800">{load.message}</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white"
            onClick={() => setRetryToken((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {load.status === "ready" ? (
        <div className="space-y-3">
          {load.items.map((session) => (
            <SessionHistoryCard key={session.id} session={session} />
          ))}
          {load.items.length < load.total ? (
            <div className="flex flex-col items-center gap-2 pt-2">
              {load.loadMoreError ? (
                <div
                  className="w-full max-w-md rounded-[1.1rem] border border-[#d8c2c2] bg-[#fbf5f5] px-4 py-3 text-center"
                  role="alert"
                >
                  <p className="text-sm text-red-800">{load.loadMoreError}</p>
                  <button
                    type="button"
                    className="mt-2 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={() => {
                      void loadMore();
                    }}
                    disabled={load.loadingMore}
                  >
                    {load.loadingMore ? "Loading…" : "Retry Load More"}
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-[#b7b2a7] bg-[#ecebe7] px-5 py-2.5 text-sm font-medium text-ix-charcoal transition hover:bg-[#e3e2dd] disabled:opacity-60"
                onClick={() => {
                  void loadMore();
                }}
                disabled={load.loadingMore}
              >
                {load.loadingMore
                  ? "Loading…"
                  : `Load more (${load.items.length} of ${load.total})`}
              </button>
            </div>
          ) : (
            <p className="pt-1 text-center text-xs text-ix-charcoal/45">
              Showing all {load.total} session{load.total === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
