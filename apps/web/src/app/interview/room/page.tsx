import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LogoMark } from "@/components/dashboard/LogoMark";

/**
 * Legacy `/interview/room` without a session ID.
 * Sessions are now created via the API and opened at `/interview/room/{id}`.
 */
export default function InterviewRoomMissingSessionPage() {
  return (
    <AuthGuard>
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
          <div className="ix-setup-panel text-center">
            <LogoMark className="mx-auto h-10 w-10" />
            <h1 className="mt-4 font-display text-2xl tracking-tight text-ix-graphite">
              Interview configuration missing
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              This room needs a saved interview session. Return to Interview
              Setup to choose your role, focus, and duration, then start a new
              session.
            </p>
            <Link
              href="/interview/setup"
              className="ix-btn-primary mt-6 inline-flex"
            >
              Go to Interview Setup
            </Link>
            <Link
              href="/dashboard"
              className="mt-3 block text-sm text-ix-indigo hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
