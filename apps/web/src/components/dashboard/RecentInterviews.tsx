"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  InterviewApiError,
  listInterviewSessions,
  type InterviewSession,
} from "@/lib/interviews";
import { SessionHistoryCard } from "./SessionHistoryCard";

const RECENT_LIMIT = 3;

type LoadState =
  | { status: "loading" }
  | { status: "ready"; items: InterviewSession[]; total: number }
  | { status: "empty" }
  | { status: "error"; message: string };

export function RecentInterviews() {
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

    listInterviewSessions({ limit: RECENT_LIMIT, offset: 0 })
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
              : "Unable to load recent interviews.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken, router]);

  return (
    <section className="ix-dash-panel" aria-labelledby="recent-interviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/55">
            Your practice
          </p>
          <h2
            id="recent-interviews-heading"
            className="mt-1.5 font-display text-[1.35rem] tracking-tight text-ix-graphite sm:text-[1.55rem]"
          >
            Recent interviews
          </h2>
          <p className="mt-2 text-sm text-ix-charcoal/65">
            Open a saved session configuration from the backend. Conversation
            history is not stored yet.
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="text-sm font-medium text-ix-indigo hover:underline"
        >
          View all history
        </Link>
      </div>

      <div className="mt-5">
        {load.status === "loading" ? (
          <p className="text-sm text-ix-charcoal/55">Loading recent sessions…</p>
        ) : null}

        {load.status === "empty" ? (
          <div className="rounded-[1.1rem] border border-dashed border-[#c9c5bc] bg-white/60 px-4 py-5">
            <p className="text-sm font-medium text-ix-graphite">
              No interviews yet
            </p>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Start a Software Engineering practice session to see it here.
            </p>
            <Link
              href="/interview/setup"
              className="ix-btn-primary mt-4 !w-auto px-4 !py-2 text-sm"
            >
              Start interview
            </Link>
          </div>
        ) : null}

        {load.status === "error" ? (
          <div className="rounded-[1.1rem] border border-[#d8c2c2] bg-[#fbf5f5] px-4 py-4">
            <p className="text-sm text-red-800">{load.message}</p>
            <button
              type="button"
              className="mt-3 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : null}

        {load.status === "ready" ? (
          <div className="grid grid-cols-1 gap-3">
            {load.items.map((session) => (
              <SessionHistoryCard
                key={session.id}
                session={session}
                compact
              />
            ))}
            {load.total > load.items.length ? (
              <p className="text-center text-xs text-ix-charcoal/50">
                Showing {load.items.length} of {load.total}.{" "}
                <Link
                  href="/dashboard/history"
                  className="text-ix-indigo hover:underline"
                >
                  Open full history
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
