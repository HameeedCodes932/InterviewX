/**
 * Licence-safe original composition — Hybrid Luxury interviewer panel.
 * Not a third-party photo or avatar runtime.
 */
export function LoginVisual() {
  return (
    <div className="relative overflow-hidden rounded-ix bg-gradient-to-br from-[#ebeae5] via-[#e3e2de] to-[#d8d7d2] shadow-card">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 78% 70%, rgba(86,87,201,0.12), transparent 40%)",
        }}
      />

      <div className="relative flex min-h-[280px] flex-col justify-between p-6 sm:min-h-[340px] sm:p-8 lg:min-h-[520px] lg:p-10">
        <div className="max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ix-charcoal/55">
            Welcome back
          </p>
          <h1 className="mt-3 font-display text-[2rem] leading-[1.12] tracking-tight text-ix-graphite sm:text-[2.35rem] lg:text-[2.75rem]">
            Interview readiness, practised with presence.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ix-charcoal/70 sm:text-[15px]">
            Sign in to continue preparing with a professional virtual interviewer —
            calm, attentive, and designed for real interview rhythm.
          </p>
        </div>

        {/* Stylised seated interviewer silhouette */}
        <div className="relative mt-8 flex flex-1 items-end justify-center lg:mt-0">
          <div className="relative h-[200px] w-full max-w-[280px] sm:h-[240px] lg:h-[300px]">
            {/* Desk */}
            <div className="absolute bottom-[18%] left-1/2 z-10 h-3 w-[86%] -translate-x-1/2 rounded-md bg-[#6d5644]/shadow-sm" />
            <div className="absolute bottom-[8%] left-[12%] h-[12%] w-[8%] rounded-sm bg-[#4f3d30]" />
            <div className="absolute bottom-[8%] right-[12%] h-[12%] w-[8%] rounded-sm bg-[#4f3d30]" />

            {/* Chair back */}
            <div className="absolute bottom-[28%] left-1/2 h-[42%] w-[38%] -translate-x-1/2 rounded-t-[1.4rem] bg-[#2c333a]" />

            {/* Torso / blazer */}
            <div className="absolute bottom-[30%] left-1/2 h-[28%] w-[34%] -translate-x-1/2 rounded-[1.1rem] bg-[#1a2f38] shadow-sm" />
            <div className="absolute bottom-[36%] left-1/2 h-[18%] w-[18%] -translate-x-1/2 rounded-md bg-[#0d7377]/opacity-90" />

            {/* Arms on desk */}
            <div className="absolute bottom-[20%] left-[22%] h-[8%] w-[22%] rotate-[-8deg] rounded-full bg-[#1a2f38]" />
            <div className="absolute bottom-[20%] right-[22%] h-[8%] w-[22%] rotate-[8deg] rounded-full bg-[#1a2f38]" />
            <div className="absolute bottom-[21%] left-[28%] h-[5%] w-[12%] rounded-full bg-[#d4a574]" />
            <div className="absolute bottom-[21%] right-[28%] h-[5%] w-[12%] rounded-full bg-[#d4a574]" />

            {/* Head */}
            <div className="absolute bottom-[54%] left-1/2 h-[22%] w-[22%] -translate-x-1/2 rounded-[45%] bg-[#e0ac69] shadow-sm" />
            {/* Hair */}
            <div className="absolute bottom-[68%] left-1/2 h-[12%] w-[24%] -translate-x-1/2 rounded-[50%] bg-[#3b2614]" />
            <div className="absolute bottom-[52%] left-[38%] h-[20%] w-[8%] rounded-b-full bg-[#3b2614]/opacity-90" />
            <div className="absolute bottom-[52%] right-[38%] h-[20%] w-[8%] rounded-b-full bg-[#3b2614]/opacity-90" />
            {/* Eyes */}
            <div className="absolute bottom-[64%] left-[45%] h-[3%] w-[3%] rounded-full bg-[#2e5a3c]" />
            <div className="absolute bottom-[64%] right-[45%] h-[3%] w-[3%] rounded-full bg-[#2e5a3c]" />

            {/* Soft glow behind figure */}
            <div
              className="absolute bottom-[25%] left-1/2 h-[55%] w-[70%] -translate-x-1/2 rounded-full opacity-40 blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.7), transparent 70%)" }}
              aria-hidden
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-ix-charcoal/45">
          Professional interviewer presence — calm, seated, interview-ready.
        </p>
      </div>
    </div>
  );
}
