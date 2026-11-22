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

export type InterviewSession = {
  id: string;
  user_id: string;
  category: InterviewCategory;
  role: string;
  experience_level: ExperienceLevel;
  focus_areas: string[];
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
  status: string;
  created_at: string;
  updated_at: string;
};
