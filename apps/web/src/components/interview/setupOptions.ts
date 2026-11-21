export const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Python Developer",
  "AI/ML Engineer",
] as const;

export const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry Level", hint: "Foundations and first-role readiness" },
  { id: "junior", label: "Junior (1–2 years)", hint: "Core skills with guided depth" },
  { id: "mid", label: "Mid-Level (3–5 years)", hint: "Ownership and applied judgment" },
  { id: "senior", label: "Senior (5+ years)", hint: "Architecture and leadership depth" },
] as const;

export const INTERVIEW_FOCUSES = [
  "Programming & Problem Solving",
  "Data Structures & Algorithms",
  "System Design",
  "Database & SQL",
  "Software Engineering Fundamentals",
  "Role-Specific Technical Questions",
] as const;

export const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    description: "Foundational questions with supportive pacing.",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced challenge across common interview topics.",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Deeper technical pressure and trade-off reasoning.",
  },
  {
    id: "mixed",
    label: "Mixed",
    description: "A blend of easy, medium, and harder prompts.",
  },
] as const;

export const DURATIONS = [
  { id: 15, label: "15 minutes" },
  { id: 30, label: "30 minutes" },
  { id: 45, label: "45 minutes" },
  { id: 60, label: "60 minutes" },
] as const;

export type TargetRole = (typeof TARGET_ROLES)[number];
export type ExperienceLevelId = (typeof EXPERIENCE_LEVELS)[number]["id"];
export type InterviewFocus = (typeof INTERVIEW_FOCUSES)[number];
export type DifficultyId = (typeof DIFFICULTIES)[number]["id"];
export type DurationMinutes = (typeof DURATIONS)[number]["id"];

export const DEFAULT_SETUP = {
  role: "Software Engineer" as TargetRole,
  experience: "mid" as ExperienceLevelId,
  focuses: ["Programming & Problem Solving"] as InterviewFocus[],
  difficulty: "medium" as DifficultyId,
  duration: 30 as DurationMinutes,
};
