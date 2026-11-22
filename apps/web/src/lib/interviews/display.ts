/**
 * Display helpers for interview session history cards.
 */

import type { InterviewSession, InterviewSessionStatus } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  software_engineering: "Software Engineering",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function statusLabel(status: InterviewSessionStatus): string {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return status;
}

export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function durationLabel(minutes: number): string {
  return `${minutes} min`;
}

export function difficultyLabel(difficulty: string): string {
  if (!difficulty) return difficulty;
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function sessionOpenHref(session: Pick<InterviewSession, "id">): string {
  return `/interview/room/${session.id}`;
}
