"use client";

import dynamic from "next/dynamic";
import type { AvatarBehaviourState, InterviewerGender } from "@interviewx/avatar";

const InterviewScene = dynamic(
  () => import("@interviewx/avatar").then((m) => m.InterviewScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-[#cfc7bb] text-sm text-ink-muted">
        Loading interviewer…
      </div>
    ),
  },
);

type Props = {
  gender: InterviewerGender;
  behaviourState?: AvatarBehaviourState;
  className?: string;
};

export function InterviewAvatarViewport({
  gender,
  behaviourState = "IDLE",
  className,
}: Props) {
  return (
    <InterviewScene
      gender={gender}
      behaviourState={behaviourState}
      className={className}
    />
  );
}
