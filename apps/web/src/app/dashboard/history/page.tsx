import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { InterviewHistory } from "@/components/dashboard/InterviewHistory";

export default function InterviewHistoryPage() {
  return (
    <AuthGuard>
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <DashboardHeader active="history" />

          <main className="mt-5 flex flex-1 flex-col sm:mt-6">
            <InterviewHistory />
          </main>

          <footer className="mt-8 shrink-0 border-t border-[#c9c5bc]/80 pb-1 pt-4 text-center text-[11px] text-ix-charcoal/45 sm:text-left">
            © {new Date().getFullYear()} InterviewX
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}
