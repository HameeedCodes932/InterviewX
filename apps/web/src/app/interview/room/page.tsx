import { AuthGuard } from "@/components/auth/AuthGuard";
import { InterviewRoom } from "@/components/interview/InterviewRoom";

export default function InterviewRoomPage() {
  return (
    <AuthGuard>
      <InterviewRoom />
    </AuthGuard>
  );
}
