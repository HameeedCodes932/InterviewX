import Link from "next/link";
import { LogoMark } from "@/components/dashboard/LogoMark";

export function SetupHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-[#bdb8ae]/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-6">
        <Link
          href="/dashboard"
          className="group inline-flex shrink-0 items-center gap-2 text-ix-graphite transition hover:opacity-90"
        >
          <LogoMark className="h-7 w-7 min-[375px]:h-8 min-[375px]:w-8" />
          <span className="font-display text-[1.2rem] font-semibold tracking-tight min-[375px]:text-[1.4rem]">
            InterviewX
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="ix-btn-secondary shrink-0 px-3 py-1.5 text-xs sm:hidden"
        >
          Back
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="rounded-full bg-[#4f51b8]/12 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#3f41a8]">
          Software Engineering
        </span>
        <Link
          href="/dashboard"
          className="ix-btn-secondary hidden px-4 py-1.5 text-sm sm:inline-flex"
        >
          Back to Dashboard
        </Link>
      </div>
    </header>
  );
}
