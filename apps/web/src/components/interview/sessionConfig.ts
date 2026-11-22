/**
 * Display helpers for interview configuration labels.
 * Persisted session data comes from the API — not browser storage.
 */

import type {
  DifficultyId,
  DurationMinutes,
  ExperienceLevelId,
} from "./setupOptions";
import { DIFFICULTIES, DURATIONS, EXPERIENCE_LEVELS } from "./setupOptions";

export function experienceLabel(id: ExperienceLevelId) {
  return EXPERIENCE_LEVELS.find((item) => item.id === id)?.label ?? id;
}

export function difficultyLabel(id: DifficultyId) {
  return DIFFICULTIES.find((item) => item.id === id)?.label ?? id;
}

export function durationLabel(id: DurationMinutes) {
  return DURATIONS.find((item) => item.id === id)?.label ?? `${id} minutes`;
}
