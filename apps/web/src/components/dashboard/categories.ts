import type { ComponentType } from "react";
import {
  IconAiMl,
  IconCssPms,
  IconHrBehavioural,
  IconIssb,
  IconScholarship,
  IconSoftwareEngineering,
} from "./CategoryIcons";

export type CategoryStatus = "available" | "coming_soon";

export type InterviewCategory = {
  id: string;
  title: string;
  description: string;
  status: CategoryStatus;
  accent: string;
  Icon: ComponentType<{ className?: string }>;
};

export const INTERVIEW_CATEGORIES: InterviewCategory[] = [
  {
    id: "software-engineering",
    title: "Software Engineering",
    description:
      "Practise technical interviews covering programming, data structures, algorithms, software engineering concepts, and problem-solving.",
    status: "available",
    accent: "#5657C9",
    Icon: IconSoftwareEngineering,
  },
  {
    id: "issb",
    title: "ISSB",
    description:
      "Prepare for psychological assessment, intelligence, personality, and officer-selection interviews.",
    status: "coming_soon",
    accent: "#3F6F8A",
    Icon: IconIssb,
  },
  {
    id: "ai-ml",
    title: "AI / Machine Learning",
    description:
      "Practise interviews covering machine learning, deep learning, NLP, LLMs, and AI engineering.",
    status: "coming_soon",
    accent: "#5A6BB5",
    Icon: IconAiMl,
  },
  {
    id: "css-pms",
    title: "CSS / PMS",
    description:
      "Prepare for competitive examination interviews, current affairs, general knowledge, and personality assessment.",
    status: "coming_soon",
    accent: "#6B5E4E",
    Icon: IconCssPms,
  },
  {
    id: "scholarship",
    title: "Scholarship Interviews",
    description:
      "Prepare for university admission, international scholarships, academic, and research interviews.",
    status: "coming_soon",
    accent: "#4F7A64",
    Icon: IconScholarship,
  },
  {
    id: "hr-behavioural",
    title: "HR / Behavioural",
    description:
      "Practise behavioural, situational, communication, and HR interviews.",
    status: "coming_soon",
    accent: "#7A5B6E",
    Icon: IconHrBehavioural,
  },
];
