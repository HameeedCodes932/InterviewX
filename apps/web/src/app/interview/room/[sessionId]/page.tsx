import { AuthGuard } from "@/components/auth/AuthGuard";
import { InterviewRoom } from "@/components/interview/InterviewRoom";

type InterviewRoomPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function InterviewRoomByIdPage({
  params,
}: InterviewRoomPageProps) {
  const { sessionId } = await params;

  return (
    <AuthGuard>
      <InterviewRoom sessionId={sessionId} />
    </AuthGuard>
  );
}
