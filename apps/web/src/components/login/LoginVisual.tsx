type Props = {
  compact?: boolean;
};

/**
 * Left visual panel — Hybrid Luxury atmosphere + polished SVG scene.
 */
export function LoginVisual({ compact = false }: Props) {
  if (compact) {
    return (
      <aside className="relative overflow-hidden rounded-[1.25rem] border border-[#d9d6cf] bg-gradient-to-br from-[#f4f2ed] to-[#e5e2db] shadow-[0_18px_40px_-28px_rgba(23,25,31,0.4)]">
        <div className="grid grid-cols-[1.15fr_0.85fr] items-end gap-2 px-4 pb-0 pt-4">
          <div className="pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/50">
              Welcome back
            </p>
            <h1 className="mt-1.5 font-display text-[1.35rem] leading-[1.18] tracking-tight text-ix-graphite">
              Interview readiness, practised with presence.
            </h1>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/interviewer-scene.svg"
            alt=""
            width={640}
            height={520}
            className="h-[118px] w-full object-contain object-bottom"
            draggable={false}
            aria-hidden
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-[#d9d6cf] bg-gradient-to-b from-[#f4f2ed] via-[#ebe8e2] to-[#ddd9d1] shadow-[0_24px_60px_-36px_rgba(23,25,31,0.45)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 18% 12%, rgba(255,255,255,0.7), transparent 55%), radial-gradient(ellipse 55% 45% at 86% 18%, rgba(86,87,201,0.10), transparent 50%), linear-gradient(165deg, transparent 40%, rgba(23,25,31,0.04) 100%)",
        }}
      />

      <div className="relative z-[1] flex h-full min-h-0 flex-col px-7 pt-7 sm:px-8 sm:pt-8 lg:px-10 lg:pt-9">
        <div className="max-w-lg shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#25262B]/opacity-50">
            Welcome back
          </p>
          <h1 className="mt-2.5 font-display text-[1.85rem] leading-[1.12] tracking-tight text-ix-graphite sm:text-[2.15rem] lg:text-[2.4rem]">
            Interview readiness, practised with presence.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ix-charcoal/65 sm:text-[15px]">
            Sign in to continue preparing with a professional virtual interviewer —
            calm, attentive, and designed for real interview rhythm.
          </p>
        </div>

        <div className="relative mt-4 flex min-h-0 flex-1 items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/interviewer-scene.svg"
            alt="Professional seated interviewer at a desk in a calm interview room"
            width={640}
            height={520}
            className="h-auto w-full max-w-[560px] translate-y-1 select-none object-contain object-bottom lg:max-h-[min(48vh,400px)]"
            draggable={false}
          />
        </div>
      </div>
    </aside>
  );
}
