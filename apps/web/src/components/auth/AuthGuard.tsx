"use client";

/**
 * Client route guard for authenticated pages.
 * Verifies the stored JWT via GET /api/v1/auth/me before rendering.
 */

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import {
  AuthError,
  ensureSessionVerified,
  getSessionSnapshot,
  isSessionVerified,
  rememberNextPath,
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

type AuthGuardProps = {
  children: ReactNode;
};

type AsyncVerify =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "network"; message: string };

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
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
  const [asyncVerify, setAsyncVerify] = useState<AsyncVerify>({ status: "idle" });
  const [retryToken, setRetryToken] = useState(0);
  const [trackedToken, setTrackedToken] = useState<string | null>(null);

  const accessToken = session?.accessToken ?? null;
  if (accessToken !== trackedToken) {
    setTrackedToken(accessToken);
    setAsyncVerify({ status: "idle" });
  }

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      rememberNextPath(pathname || "/dashboard");
      router.replace("/login");
      return;
    }

    if (isSessionVerified(session.accessToken)) {
      return;
    }

    let cancelled = false;
    ensureSessionVerified()
      .then(() => {
        if (!cancelled) setAsyncVerify({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AuthError && error.code === "unauthenticated") {
          rememberNextPath(pathname || "/dashboard");
          router.replace("/login");
          return;
        }
        setAsyncVerify({
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
  }, [ready, session, pathname, router, retryToken]);

  if (!ready || !session) {
    return (
      <div className="ix-dashboard-shell flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Checking session…</p>
      </div>
    );
  }

  if (isSessionVerified(session.accessToken) || asyncVerify.status === "ready") {
    return <>{children}</>;
  }

  if (asyncVerify.status === "network") {
    return (
      <div className="ix-dashboard-shell flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-ix-charcoal/70">{asyncVerify.message}</p>
          <p className="mt-2 text-xs text-ix-charcoal/45">
            Your session was not cleared. Check that the API is running, then
            retry.
          </p>
          <button
            type="button"
            className="mt-4 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            onClick={() => {
              setAsyncVerify({ status: "idle" });
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
    <div className="ix-dashboard-shell flex min-h-dvh items-center justify-center px-4">
      <p className="text-sm text-ix-charcoal/55">Checking session…</p>
    </div>
  );
}
