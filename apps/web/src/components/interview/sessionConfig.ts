import type {
  DifficultyId,
  DurationMinutes,
  ExperienceLevelId,
  InterviewFocus,
  TargetRole,
} from "./setupOptions";
import {
  DIFFICULTIES,
  DURATIONS,
  EXPERIENCE_LEVELS,
  INTERVIEW_FOCUSES,
  TARGET_ROLES,
} from "./setupOptions";

export const SESSION_CONFIG_KEY = "interviewx.session.config";

export type InterviewSessionConfig = {
  category: "Software Engineering";
  role: TargetRole;
  experience: ExperienceLevelId;
  focuses: InterviewFocus[];
  difficulty: DifficultyId;
  duration: DurationMinutes;
};

function isTargetRole(value: unknown): value is TargetRole {
  return typeof value === "string" && (TARGET_ROLES as readonly string[]).includes(value);
}

function isExperience(value: unknown): value is ExperienceLevelId {
  return (
    typeof value === "string" &&
    EXPERIENCE_LEVELS.some((item) => item.id === value)
  );
}

function isDifficulty(value: unknown): value is DifficultyId {
  return typeof value === "string" && DIFFICULTIES.some((item) => item.id === value);
}

function isDuration(value: unknown): value is DurationMinutes {
  return typeof value === "number" && DURATIONS.some((item) => item.id === value);
}

function isFocusList(value: unknown): value is InterviewFocus[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === "string" &&
        (INTERVIEW_FOCUSES as readonly string[]).includes(item),
    )
  );
}

let cachedRaw: string | null | undefined;
let cachedConfig: InterviewSessionConfig | null = null;

export function writeSessionConfig(config: InterviewSessionConfig) {
  try {
    const raw = JSON.stringify(config);
    sessionStorage.setItem(SESSION_CONFIG_KEY, raw);
    cachedRaw = raw;
    cachedConfig = config;
  } catch {
    /* ignore quota / private mode */
  }
}

export function readSessionConfig(): InterviewSessionConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CONFIG_KEY);
    if (raw === cachedRaw) return cachedConfig;
    cachedRaw = raw;
    if (!raw) {
      cachedConfig = null;
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<InterviewSessionConfig>;
    if (
      parsed.category !== "Software Engineering" ||
      !isTargetRole(parsed.role) ||
      !isExperience(parsed.experience) ||
      !isFocusList(parsed.focuses) ||
      !isDifficulty(parsed.difficulty) ||
      !isDuration(parsed.duration)
    ) {
      cachedConfig = null;
      return null;
    }
    cachedConfig = {
      category: "Software Engineering",
      role: parsed.role,
      experience: parsed.experience,
      focuses: parsed.focuses,
      difficulty: parsed.difficulty,
      duration: parsed.duration,
    };
    return cachedConfig;
  } catch {
    cachedRaw = undefined;
    cachedConfig = null;
    return null;
  }
}

export function experienceLabel(id: ExperienceLevelId) {
  return EXPERIENCE_LEVELS.find((item) => item.id === id)?.label ?? id;
}

export function difficultyLabel(id: DifficultyId) {
  return DIFFICULTIES.find((item) => item.id === id)?.label ?? id;
}

export function durationLabel(id: DurationMinutes) {
  return DURATIONS.find((item) => item.id === id)?.label ?? `${id} minutes`;
}
