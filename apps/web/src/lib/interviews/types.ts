export type InterviewCategory = "software_engineering";
export type ExperienceLevel = "entry" | "junior" | "mid" | "senior";
export type Difficulty = "easy" | "medium" | "hard" | "mixed";
export type DurationMinutes = 15 | 30 | 45 | 60;

export type InterviewSessionCreateRequest = {
  category: InterviewCategory;
  role: string;
  experience_level: ExperienceLevel;
  focus_areas: string[];
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
};

export type InterviewSessionStatus = "in_progress" | "completed" | string;

export type InterviewSession = {
  id: string;
  user_id: string;
  category: InterviewCategory;
  role: string;
  experience_level: ExperienceLevel;
  focus_areas: string[];
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
  status: InterviewSessionStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InterviewSessionListResponse = {
  items: InterviewSession[];
  total: number;
  limit: number;
  offset: number;
};

export type ListInterviewSessionsParams = {
  limit?: number;
  offset?: number;
};

export type InterviewMessageSpeaker = "interviewer" | "candidate";

export type InterviewMessage = {
  id: string;
  session_id: string;
  speaker: InterviewMessageSpeaker;
  content: string;
  sequence: number;
  client_message_id: string;
  created_at: string;
};

export type InterviewMessageListResponse = {
  items: InterviewMessage[];
};

export type InterviewMessageCreateRequest = {
  speaker: InterviewMessageSpeaker;
  content: string;
  client_message_id: string;
};

export type InterviewRespondRequest = {
  candidate_client_message_id: string;
};
