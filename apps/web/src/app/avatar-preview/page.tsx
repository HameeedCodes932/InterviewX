"use client";

import { useState } from "react";
import type { InterviewerGender } from "@interviewx/avatar";
import { InterviewAvatarViewport } from "@/components/InterviewAvatarViewport";

/**
 * Local QA page: seated male/female interviewers with idle animation.
 * No LiveKit required. Prefer the real interview room for product flow.
 */
export default function AvatarPreviewPage() {
  const [gender, setGender] = useState<InterviewerGender>("female");

  return (
    <div className="min-h-screen bg-[#cfc7bb] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl text-ink">Avatar preview</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Phase 2 seated interviewers — idle breathing and blink. Switch gender to
          confirm distinct meshes.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className={`btn-secondary ${gender === "female" ? "ring-2 ring-teal" : ""}`}
            onClick={() => setGender("female")}
          >
            Female
          </button>
          <button
            type="button"
            className={`btn-secondary ${gender === "male" ? "ring-2 ring-teal" : ""}`}
            onClick={() => setGender("male")}
          >
            Male
          </button>
        </div>
        <div className="mt-6 h-[min(70vh,560px)] overflow-hidden rounded-2xl border border-ink/15 shadow-soft">
          <InterviewAvatarViewport gender={gender} behaviourState="IDLE" className="h-full" />
        </div>
      </div>
    </div>
  );
}
