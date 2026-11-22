import Link from "next/link";
import {
  categoryLabel,
  difficultyLabel,
  durationLabel,
  formatSessionDate,
  sessionOpenHref,
  statusLabel,
  type InterviewSession,
} from "@/lib/interviews";

type SessionHistoryCardProps = {
  session: InterviewSession;
  compact?: boolean;
};

export function SessionHistoryCard({
  session,
  compact = false,
}: SessionHistoryCardProps) {
  const completed = session.status === "completed";

  return (
    <article
      className={`rounded-[1.1rem] border border-[#c9c5bc] bg-white/85 shadow-[0_10px_24px_-20px_rgba(23,25,31,0.35)] ${
        compact ? "px-3.5 py-3.5" : "px-4 py-4 sm:px-5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ix-charcoal/50">
            {categoryLabel(session.category)}
          </p>
          <h3 className="mt-1 font-display text-[1.15rem] tracking-tight text-ix-graphite">
            {session.role}
          </h3>
          <p className="mt-1 text-sm text-ix-charcoal/60">
            {formatSessionDate(session.created_at)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            completed
              ? "border border-[#c4bfb5] bg-white text-ix-charcoal/65"
              : "bg-[#4f51b8]/12 text-[#3f41a8]"
          }`}
        >
          {statusLabel(session.status)}
        </span>
      </div>

      <dl
        className={`mt-3 grid gap-2 text-sm ${
          compact
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        <div>
          <dt className="text-[11px] text-ix-charcoal/50">Difficulty</dt>
          <dd className="font-medium text-ix-graphite">
            {difficultyLabel(session.difficulty)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ix-charcoal/50">Duration</dt>
          <dd className="font-medium text-ix-graphite">
            {durationLabel(session.duration_minutes)}
          </dd>
        </div>
        {!compact ? (
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[11px] text-ix-charcoal/50">Focus</dt>
            <dd className="font-medium text-ix-graphite">
              {session.focus_areas.slice(0, 2).join(" · ")}
              {session.focus_areas.length > 2 ? "…" : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Link
          href={sessionOpenHref(session)}
          className="ix-btn-primary !w-auto px-4 !py-2 text-sm"
        >
          Open session
        </Link>
        <p className="text-[11px] leading-relaxed text-ix-charcoal/45">
          Configuration only — conversation transcripts are not saved yet.
        </p>
      </div>
    </article>
  );
}
