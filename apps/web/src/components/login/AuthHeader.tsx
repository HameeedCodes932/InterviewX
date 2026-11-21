import Link from "next/link";

function LogoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className="h-8 w-8"
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="#17191F" />
      <path
        d="M13 22.5L20 14l7 8.5"
        stroke="#F5F5F2"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 16.5V27"
        stroke="#F5F5F2"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = {
  /** Defaults keep the approved login header unchanged. */
  actionHref?: string;
  actionLabel?: string;
};

export function AuthHeader({
  actionHref = "/signup",
  actionLabel = "Create account",
}: Props) {
  return (
    <header className="flex items-center justify-between gap-2 min-[375px]:gap-4">
      <Link
        href="/login"
        className="group inline-flex min-w-0 items-center gap-2 text-ix-graphite transition hover:opacity-90 min-[375px]:gap-2.5"
      >
        <LogoMark />
        <span className="truncate font-display text-[1.25rem] font-semibold tracking-tight min-[375px]:text-[1.4rem] sm:text-[1.55rem]">
          InterviewX
        </span>
      </Link>

      <Link
        href={actionHref}
        className="ix-btn-secondary shrink-0 px-3 py-1.5 text-xs min-[375px]:px-4 min-[375px]:py-2 min-[375px]:text-sm sm:px-5"
      >
        {actionLabel}
      </Link>
    </header>
  );
}
