import { CategoryGrid } from "@/components/dashboard/CategoryGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HowItWorks } from "@/components/dashboard/HowItWorks";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";

export default function DashboardPage() {
  return (
    <div className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <DashboardHeader />

        <main className="mt-5 flex flex-1 flex-col gap-7 sm:mt-6 sm:gap-8 lg:gap-9">
          <WelcomeSection />
          <CategoryGrid />
          <HowItWorks />
        </main>

        <footer className="mt-8 shrink-0 border-t border-[#d9d6cf]/60 pb-1 pt-4 text-center text-[11px] text-ix-charcoal/35 sm:text-left">
          © {new Date().getFullYear()} InterviewX
        </footer>
      </div>
    </div>
  );
}
