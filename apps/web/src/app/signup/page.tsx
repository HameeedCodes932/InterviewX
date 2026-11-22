import { GuestGuard } from "@/components/auth/GuestGuard";
import { SignupForm } from "@/components/signup/SignupForm";
import { SignupVisual } from "@/components/signup/SignupVisual";

export default function SignupPage() {
  return (
    <GuestGuard>
      <div className="relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-5 min-[375px]:px-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <main className="flex flex-1 flex-col justify-center">
            {/* Mobile / tablet: compact visual then full form */}
            <div className="flex flex-col gap-5 lg:hidden">
              <SignupVisual compact />
              <div className="mx-auto w-full max-w-md">
                <SignupForm />
              </div>
            </div>

            {/* Desktop: split layout — page scrolls so the full form stays visible */}
            <div className="hidden grid-cols-[0.95fr_1.05fr] items-start gap-7 lg:grid xl:gap-9">
              <section className="lg:sticky lg:top-8 lg:self-start">
                <div className="h-[min(72vh,640px)]">
                  <SignupVisual />
                </div>
              </section>
              <section className="flex items-start justify-end">
                <div className="w-full max-w-[420px]">
                  <SignupForm />
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </GuestGuard>
  );
}
