"use client";

/**
 * Redirects authenticated users away from login/signup.
 */

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeAuth } from "@/lib/auth";

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

  useEffect(() => {
    if (!ready) return;
    if (!session) return;
    router.replace("/dashboard");
  }, [ready, session, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Loading…</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Redirecting to dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
