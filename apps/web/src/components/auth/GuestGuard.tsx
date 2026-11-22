"use client";

/**
 * DEMO-ONLY guest guard — sends authenticated users away from login/signup.
 */

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeDemoAuth } from "@/lib/demo-auth";

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
    subscribeDemoAuth,
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
