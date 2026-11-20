export type InterviewerGender = "male" | "female";

export type AvatarBehaviourState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "ACKNOWLEDGING"
  | "SPEAKING"
  | "QUESTIONING"
  | "NOTE_TAKING"
  | "REACTING"
  | "INTERRUPTED";

export const AVATAR_ASSET_PATHS: Record<InterviewerGender, string> = {
  male: "/avatars/interviewer_male_v1.glb",
  female: "/avatars/interviewer_female_v1.glb",
};

export const AVATAR_IDS: Record<InterviewerGender, string> = {
  male: "interviewer_male_v1",
  female: "interviewer_female_v1",
};
