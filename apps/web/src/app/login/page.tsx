import { GuestGuard } from "@/components/auth/GuestGuard";
import { AuthHeader } from "@/components/login/AuthHeader";
import { LoginForm } from "@/components/login/LoginForm";
import { LoginVisual } from "@/components/login/LoginVisual";

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="relative min-h-dvh lg:h-dvh lg:overflow-hidden">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-5 lg:h-dvh lg:max-h-dvh lg:px-8 lg:py-6">
          <AuthHeader />

          <main className="mt-4 flex min-h-0 flex-1 flex-col lg:mt-5">
            {/* Mobile / tablet: compact visual then form */}
            <div className="flex flex-1 flex-col gap-4 lg:hidden">
              <LoginVisual compact />
              <div className="mx-auto w-full max-w-md flex-1">
                <LoginForm />
              </div>
            </div>

            {/* Desktop: balanced split, viewport-fit */}
            <div className="hidden min-h-0 flex-1 grid-cols-[1.12fr_0.88fr] items-stretch gap-8 lg:grid xl:gap-10">
              <section className="min-h-0">
                <LoginVisual />
              </section>
              <section className="flex min-h-0 items-center justify-end">
                <div className="w-full max-w-[400px]">
                  <LoginForm />
                </div>
              </section>
            </div>
          </main>

          <footer className="mt-3 shrink-0 pb-1 text-center text-[11px] text-ix-charcoal/35 sm:text-left">
            © {new Date().getFullYear()} InterviewX
          </footer>
        </div>
      </div>
    </GuestGuard>
  );
}
