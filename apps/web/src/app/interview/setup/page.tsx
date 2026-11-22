import { AuthGuard } from "@/components/auth/AuthGuard";
import { InterviewSetupForm } from "@/components/interview/InterviewSetupForm";
import { SetupHeader } from "@/components/interview/SetupHeader";

export default function InterviewSetupPage() {
  return (
    <AuthGuard>
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <SetupHeader />

          <main className="mt-5 flex flex-1 flex-col gap-5 sm:mt-6 sm:gap-6">
            <section className="ix-dash-welcome relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 70% 80% at 0% 0%, rgba(255,255,255,0.8), transparent 55%), radial-gradient(ellipse 50% 60% at 100% 20%, rgba(79,81,184,0.12), transparent 50%)",
                }}
              />
              <div className="relative z-[1] max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ix-charcoal/55">
                  Software Engineering interview
                </p>
                <h1 className="mt-2.5 font-display text-[1.7rem] leading-[1.15] tracking-tight text-ix-graphite sm:text-[2.1rem]">
                  Configure your interview
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ix-charcoal/72 sm:text-base">
                  Customize your practice session before meeting your AI
                  interviewer.
                </p>
              </div>
            </section>

            <InterviewSetupForm />
          </main>

          <footer className="mt-8 shrink-0 border-t border-[#c9c5bc]/80 pb-1 pt-4 text-center text-[11px] text-ix-charcoal/45 sm:text-left">
            © {new Date().getFullYear()} InterviewX
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}
