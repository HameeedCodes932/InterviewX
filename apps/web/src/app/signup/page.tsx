import { AuthHeader } from "@/components/login/AuthHeader";
import { SignupForm } from "@/components/signup/SignupForm";
import { SignupVisual } from "@/components/signup/SignupVisual";

export default function SignupPage() {
  return (
    <div className="relative min-h-dvh lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-5 lg:h-dvh lg:max-h-dvh lg:px-8 lg:py-5">
        <AuthHeader actionHref="/login" actionLabel="Sign in" />

        <main className="mt-3 flex min-h-0 flex-1 flex-col lg:mt-4">
          {/* Mobile / tablet: compact visual then form */}
          <div className="flex flex-1 flex-col gap-4 lg:hidden">
            <SignupVisual compact />
            <div className="mx-auto w-full max-w-md flex-1">
              <SignupForm />
            </div>
          </div>

          {/* Desktop: balanced split, viewport-fit */}
          <div className="hidden min-h-0 flex-1 grid-cols-[0.95fr_1.05fr] items-stretch gap-7 lg:grid xl:gap-9">
            <section className="min-h-0">
              <SignupVisual />
            </section>
            <section className="flex min-h-0 items-center justify-end overflow-y-auto py-1">
              <div className="w-full max-w-[420px]">
                <SignupForm />
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-3 shrink-0 pb-1 text-center text-[11px] text-ix-charcoal/35 sm:text-left">
          © {new Date().getFullYear()} InterviewX
        </footer>
      </div>
    </div>
  );
}
