import { AuthHeader } from "@/components/login/AuthHeader";
import { LoginForm } from "@/components/login/LoginForm";
import { LoginVisual } from "@/components/login/LoginVisual";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
        <AuthHeader />

        <main className="mt-6 flex flex-1 flex-col justify-center lg:mt-10">
          <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <section className="order-1">
              <LoginVisual />
            </section>

            <section className="order-2 flex items-center">
              <div className="w-full max-w-md lg:ml-auto lg:max-w-[420px]">
                <LoginForm />
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-8 pb-2 text-center text-xs text-ix-charcoal/40 sm:text-left">
          © {new Date().getFullYear()} InterviewX
        </footer>
      </div>
    </div>
  );
}
