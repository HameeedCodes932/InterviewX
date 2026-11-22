/**
 * Unobtrusive DEMO MODE label — this is not production authentication.
 */
export function DemoModeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#c4bfb5] bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ix-charcoal/55 ${className}`}
      title="Browser-only demo authentication for local testing — not production security"
    >
      Demo Mode
    </span>
  );
}
