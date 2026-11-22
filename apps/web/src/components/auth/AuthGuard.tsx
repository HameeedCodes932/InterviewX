"use client";

/**
 * DEMO-ONLY client route guard.
 * Can be bypassed by editing browser storage — not production security.
 */

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  rememberNextPath,
  subscribeDemoAuth,
} from "@/lib/demo-auth";

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

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    if (session) return;
    rememberNextPath(pathname || "/dashboard");
    router.replace("/login");
  }, [ready, session, pathname, router]);

  if (!ready || !session) {
    return (
      <div className="ix-dashboard-shell flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Checking demo session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
