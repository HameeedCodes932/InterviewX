export function WelcomeSection() {
  return (
    <section className="ix-dash-welcome relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 80% at 0% 0%, rgba(255,255,255,0.75), transparent 55%), radial-gradient(ellipse 50% 60% at 100% 20%, rgba(86,87,201,0.10), transparent 50%)",
        }}
      />
      <div className="relative z-[1] max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ix-charcoal/55">
          Welcome to InterviewX
        </p>
        <h1 className="mt-2.5 font-display text-[1.75rem] leading-[1.15] tracking-tight text-ix-graphite sm:text-[2.15rem] lg:text-[2.35rem]">
          Prepare for the interviews that shape your future.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ix-charcoal/72 sm:text-base">
          InterviewX helps you practise through realistic AI-powered interview
          simulations — calm, structured, and designed for the moments that
          matter.
        </p>
      </div>
    </section>
  );
}
