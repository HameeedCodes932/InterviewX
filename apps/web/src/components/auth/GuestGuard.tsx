"use client";

/**
 * Redirects authenticated users away from login/signup after verifying
 * the stored JWT. Invalid tokens are cleared so guests can sign in.
 */

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import {
  AuthError,
  ensureSessionVerified,
  getSessionSnapshot,
  isSessionVerified,
  subscribeAuth,
} from "@/lib/auth";

function subscribeNever() {
  return () => {};
}

function getClientTrue() {
  return true;
}

function getServerFalse() {
  return false;
}

type GuestGuardProps = {
  children: ReactNode;
};

type AsyncGuest =
  | { status: "idle" }
  | { status: "authenticated" }
  | { status: "invalid" }
  | { status: "network"; message: string };

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribeNever,
    getClientTrue,
    getServerFalse,
  );
  const session = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    () => null,
  );
  const [asyncGuest, setAsyncGuest] = useState<AsyncGuest>({ status: "idle" });
  const [retryToken, setRetryToken] = useState(0);
  const [trackedToken, setTrackedToken] = useState<string | null>(null);

  const accessToken = session?.accessToken ?? null;
  if (accessToken !== trackedToken) {
    setTrackedToken(accessToken);
    setAsyncGuest({ status: "idle" });
  }

  useEffect(() => {
    if (!ready) return;
    if (!session) return;

    if (isSessionVerified(session.accessToken)) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    ensureSessionVerified()
      .then(() => {
        if (cancelled) return;
        setAsyncGuest({ status: "authenticated" });
        router.replace("/dashboard");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AuthError && error.code === "unauthenticated") {
          setAsyncGuest({ status: "invalid" });
          return;
        }
        setAsyncGuest({
          status: "network",
          message:
            error instanceof AuthError
              ? error.message
              : "Unable to verify your session with the API.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, session, router, retryToken]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Loading…</p>
      </div>
    );
  }

  if (!session || asyncGuest.status === "invalid") {
    return <>{children}</>;
  }

  if (asyncGuest.status === "network") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-ix-charcoal/70">{asyncGuest.message}</p>
          <p className="mt-2 text-xs text-ix-charcoal/45">
            We could not confirm whether you are signed in. Retry when the API
            is available.
          </p>
          <button
            type="button"
            className="mt-4 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            onClick={() => {
              setAsyncGuest({ status: "idle" });
              setRetryToken((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <p className="text-sm text-ix-charcoal/55">
        {isSessionVerified(session.accessToken) ||
        asyncGuest.status === "authenticated"
          ? "Redirecting to dashboard…"
          : "Loading…"}
      </p>
    </div>
  );
}
