"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import {
  InterviewApiError,
  createInterviewSession,
} from "@/lib/interviews";
import {
  DEFAULT_SETUP,
  DIFFICULTIES,
  DURATIONS,
  EXPERIENCE_LEVELS,
  INTERVIEW_FOCUSES,
  TARGET_ROLES,
  type DifficultyId,
  type DurationMinutes,
  type ExperienceLevelId,
  type InterviewFocus,
  type TargetRole,
} from "./setupOptions";


function OptionButton({
  selected,
  onClick,
  children,
  className = "",
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`ix-setup-option text-left ${selected ? "ix-setup-option-selected" : ""} ${className}`}
    >
      <span className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
            multi ? "rounded-sm" : "rounded-full"
          } ${
            selected
              ? "border-[#4f51b8] bg-[#4f51b8] text-white"
              : "border-[#b7b2a7] bg-white"
          }`}
          aria-hidden
        >
          {selected ? (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
              <path
                d="M2.5 6.2 4.8 8.5 9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </span>
    </button>
  );
}

export function InterviewSetupForm() {
  const router = useRouter();
  const [role, setRole] = useState<TargetRole>(DEFAULT_SETUP.role);
  const [experience, setExperience] = useState<ExperienceLevelId>(
    DEFAULT_SETUP.experience,
  );
  const [focuses, setFocuses] = useState<InterviewFocus[]>(DEFAULT_SETUP.focuses);
  const [difficulty, setDifficulty] = useState<DifficultyId>(
    DEFAULT_SETUP.difficulty,
  );
  const [duration, setDuration] = useState<DurationMinutes>(
    DEFAULT_SETUP.duration,
  );
  const [focusError, setFocusError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const experienceLabel = useMemo(
    () => EXPERIENCE_LEVELS.find((item) => item.id === experience)?.label ?? experience,
    [experience],
  );
  const difficultyMeta = useMemo(
    () => DIFFICULTIES.find((item) => item.id === difficulty),
    [difficulty],
  );
  const durationLabel = useMemo(
    () => DURATIONS.find((item) => item.id === duration)?.label ?? `${duration} minutes`,
    [duration],
  );

  function toggleFocus(focus: InterviewFocus) {
    setFocuses((current) => {
      const next = current.includes(focus)
        ? current.filter((item) => item !== focus)
        : [...current, focus];
      if (next.length > 0) setFocusError(null);
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (focuses.length === 0) {
      setFocusError("Select at least one interview focus.");
      return;
    }

    setFocusError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const session = await createInterviewSession({
        category: "software_engineering",
        role,
        experience_level: experience,
        focus_areas: focuses,
        difficulty,
        duration_minutes: duration,
      });
      router.push(`/interview/room/${session.id}`);
    } catch (error) {
      if (error instanceof InterviewApiError) {
        setFormError(error.message);
      } else {
        setFormError("Unable to create the interview session. Please try again.");
      }
      setSubmitting(false);
    }
  }

  const summary = (
    <aside className="ix-setup-summary" aria-live="polite">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ix-charcoal/55">
        Session summary
      </p>
      <h2 className="mt-1.5 font-display text-[1.25rem] tracking-tight text-ix-graphite">
        Your configuration
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-ix-charcoal/50">Category</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">
            Software Engineering
          </dd>
        </div>
        <div>
          <dt className="text-ix-charcoal/50">Target role</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">{role}</dd>
        </div>
        <div>
          <dt className="text-ix-charcoal/50">Experience</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">{experienceLabel}</dd>
        </div>
        <div>
          <dt className="text-ix-charcoal/50">Interview focus</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">
            {focuses.length > 0 ? focuses.join(", ") : "None selected"}
          </dd>
        </div>
        <div>
          <dt className="text-ix-charcoal/50">Difficulty</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">
            {difficultyMeta?.label}
            {difficultyMeta ? (
              <span className="mt-0.5 block text-[13px] font-normal text-ix-charcoal/60">
                {difficultyMeta.description}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-ix-charcoal/50">Duration</dt>
          <dd className="mt-0.5 font-medium text-ix-graphite">{durationLabel}</dd>
        </div>
      </dl>
    </aside>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 lg:gap-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-7">
        <div className="space-y-5">
          <section className="ix-setup-panel" aria-labelledby="role-heading">
            <h2
              id="role-heading"
              className="font-display text-[1.2rem] tracking-tight text-ix-graphite"
            >
              Target role
            </h2>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Choose the role you want this practice session to mirror.
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {TARGET_ROLES.map((item) => (
                <OptionButton
                  key={item}
                  selected={role === item}
                  onClick={() => setRole(item)}
                >
                  <span className="text-sm font-medium text-ix-graphite">{item}</span>
                </OptionButton>
              ))}
            </div>
          </section>

          <section className="ix-setup-panel" aria-labelledby="experience-heading">
            <h2
              id="experience-heading"
              className="font-display text-[1.2rem] tracking-tight text-ix-graphite"
            >
              Experience level
            </h2>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Set the depth and expectation of the conversation.
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {EXPERIENCE_LEVELS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={experience === item.id}
                  onClick={() => setExperience(item.id)}
                >
                  <span className="block text-sm font-medium text-ix-graphite">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ix-charcoal/55">
                    {item.hint}
                  </span>
                </OptionButton>
              ))}
            </div>
          </section>

          <section className="ix-setup-panel" aria-labelledby="focus-heading">
            <h2
              id="focus-heading"
              className="font-display text-[1.2rem] tracking-tight text-ix-graphite"
            >
              Interview focus
            </h2>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Select one or more areas to emphasise during practice.
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {INTERVIEW_FOCUSES.map((item) => (
                <OptionButton
                  key={item}
                  multi
                  selected={focuses.includes(item)}
                  onClick={() => toggleFocus(item)}
                >
                  <span className="text-sm font-medium text-ix-graphite">{item}</span>
                </OptionButton>
              ))}
            </div>
            {focusError ? (
              <p className="mt-2 text-sm text-red-800" role="alert">
                {focusError}
              </p>
            ) : null}
          </section>

          <section className="ix-setup-panel" aria-labelledby="difficulty-heading">
            <h2
              id="difficulty-heading"
              className="font-display text-[1.2rem] tracking-tight text-ix-graphite"
            >
              Difficulty
            </h2>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Pick the intensity that matches your preparation goals.
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {DIFFICULTIES.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={difficulty === item.id}
                  onClick={() => setDifficulty(item.id)}
                >
                  <span className="block text-sm font-medium text-ix-graphite">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ix-charcoal/55">
                    {item.description}
                  </span>
                </OptionButton>
              ))}
            </div>
          </section>

          <section className="ix-setup-panel" aria-labelledby="duration-heading">
            <h2
              id="duration-heading"
              className="font-display text-[1.2rem] tracking-tight text-ix-graphite"
            >
              Interview duration
            </h2>
            <p className="mt-1 text-sm text-ix-charcoal/60">
              Choose how long you want this practice session to run.
            </p>
            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DURATIONS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={duration === item.id}
                  onClick={() => setDuration(item.id)}
                  className="min-h-[3rem]"
                >
                  <span className="text-sm font-medium text-ix-graphite">
                    {item.label}
                  </span>
                </OptionButton>
              ))}
            </div>
          </section>
        </div>

        <div className="hidden lg:block lg:sticky lg:top-6">{summary}</div>
      </div>

      <div className="lg:hidden">{summary}</div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ix-charcoal/55">
            Review your summary, then enter the interview room. The AI interview
            engine is not connected yet — conversation is simulated locally.
          </p>
          {formError ? (
            <p className="mt-2 text-sm text-red-800" role="alert">
              {formError}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="ix-btn-primary sm:w-auto sm:min-w-[12rem] sm:px-8"
          disabled={submitting}
        >
          {submitting ? "Opening room…" : "Start Interview"}
        </button>
      </div>
    </form>
  );
}
