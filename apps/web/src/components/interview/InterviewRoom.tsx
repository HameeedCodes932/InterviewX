"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LogoMark } from "@/components/dashboard/LogoMark";
import {
  difficultyLabel,
  durationLabel,
  experienceLabel,
  readSessionConfig,
} from "./sessionConfig";

type ChatMessage = {
  id: string;
  speaker: "interviewer" | "candidate";
  text: string;
};

const GREETING =
  "Hello! Welcome to your Software Engineering interview. Let's start by getting to know you. Could you briefly introduce yourself and tell me about your technical background?";

function subscribeSessionConfig(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function InterviewRoom() {
  const router = useRouter();
  const config = useSyncExternalStore(
    subscribeSessionConfig,
    readSessionConfig,
    () => null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", speaker: "interviewer", text: GREETING },
  ]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (!config) {
    return (
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
          <div className="ix-setup-panel text-center">
            <LogoMark className="mx-auto h-10 w-10" />
            <h1 className="mt-4 font-display text-2xl tracking-tight text-ix-graphite">
              Interview configuration missing
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              This room needs a Software Engineering setup before a practice
              session can begin. Return to Interview Setup to choose your role,
              focus, and duration.
            </p>
            <Link
              href="/interview/setup"
              className="ix-btn-primary mt-6 inline-flex"
            >
              Go to Interview Setup
            </Link>
            <Link
              href="/dashboard"
              className="mt-3 block text-sm text-ix-indigo hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      setDraftError("Enter a response before sending.");
      return;
    }
    setDraftError(null);
    setMessages((current) => [
      ...current,
      {
        id: `candidate-${Date.now()}`,
        speaker: "candidate",
        text,
      },
    ]);
    setDraft("");
  }

  function toggleMic() {
    setMicOn((value) => !value);
    setDeviceNotice(
      "Voice engine not connected — microphone control is visual only and does not access your device.",
    );
  }

  function toggleCamera() {
    setCameraOn((value) => !value);
    setDeviceNotice(
      "Camera is not connected — this control is visual only and does not request camera access.",
    );
  }

  function confirmEnd() {
    setConfirmExit(false);
    router.push("/dashboard");
  }

  return (
    <div className="ix-dashboard-shell relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1240px] flex-col px-3 py-3 min-[375px]:px-4 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bdb8ae]/80 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 text-ix-graphite"
            >
              <LogoMark className="h-7 w-7" />
              <span className="hidden font-display text-[1.2rem] font-semibold tracking-tight min-[400px]:inline">
                InterviewX
              </span>
            </Link>
            <span className="rounded-full bg-[#4f51b8]/12 px-2.5 py-1 text-[11px] font-semibold text-[#3f41a8]">
              Software Engineering
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#c4bfb5] bg-white/80 px-3 py-1 text-xs text-ix-charcoal/65 sm:inline">
              {durationLabel(config.duration)} · {difficultyLabel(config.difficulty)}
            </span>
            <button
              type="button"
              className="rounded-full border border-[#b7b2a7] bg-[#ecebe7] px-3 py-1.5 text-sm font-medium text-ix-charcoal transition hover:bg-[#e3e2dd]"
              onClick={() => setConfirmExit(true)}
            >
              Exit interview
            </button>
          </div>
        </header>

        <main className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-5">
          <section className="ix-room-stage flex min-h-0 flex-col">
            <div className="relative overflow-hidden rounded-[1.15rem] bg-[#1c1e24]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ai-interviewer-portrait.jpg"
                alt="Professional AI interviewer seated and facing the camera"
                className="aspect-[4/3] h-auto w-full object-cover object-[center_18%] sm:aspect-[16/10] lg:aspect-[16/11] lg:max-h-[min(52vh,520px)]"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ix-graphite">
                    AI Interviewer
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#8fd6a8]"
                      aria-hidden
                    />
                    Simulated listening
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2 text-[12px] text-ix-charcoal/55">
              Static interviewer preview — no live AI speaking or listening is
              active in this UI stage.
            </p>

            <aside className="ix-setup-panel mt-3 !p-3 sm:!p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ix-charcoal/50">
                Session information
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Role</dt>
                  <dd className="font-medium text-ix-graphite">{config.role}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Experience</dt>
                  <dd className="font-medium text-ix-graphite">
                    {experienceLabel(config.experience)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Difficulty</dt>
                  <dd className="font-medium text-ix-graphite">
                    {difficultyLabel(config.difficulty)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Duration</dt>
                  <dd className="font-medium text-ix-graphite">
                    {durationLabel(config.duration)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[12px] leading-relaxed text-ix-charcoal/55">
                Focus: {config.focuses.join(" · ")}
              </p>
            </aside>
          </section>

          <section className="ix-room-chat flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-[#cfcbc3] px-1 pb-2">
              <h2 className="font-display text-[1.15rem] tracking-tight text-ix-graphite">
                Conversation
              </h2>
              <span className="text-[11px] font-medium text-ix-charcoal/50">
                Local simulation
              </span>
            </div>

            <div
              ref={transcriptRef}
              className="mt-3 flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto pr-1 sm:min-h-[260px] lg:min-h-0"
              aria-live="polite"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[95%] rounded-[1rem] px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.speaker === "interviewer"
                      ? "self-start border border-[#cfc9e8] bg-[#eef0fb] text-ix-charcoal"
                      : "self-end border border-[#c9c5bc] bg-white text-ix-graphite"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ix-charcoal/45">
                    {message.speaker === "interviewer"
                      ? "AI Interviewer"
                      : "You"}
                  </p>
                  <p className="mt-1">{message.text}</p>
                </div>
              ))}
            </div>

            <form className="mt-3 border-t border-[#cfcbc3] pt-3" onSubmit={submitMessage}>
              <label htmlFor={inputId} className="sr-only">
                Your response
              </label>
              <textarea
                id={inputId}
                rows={3}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (draftError) setDraftError(null);
                }}
                placeholder="Type your response…"
                className="ix-field min-h-[5.5rem] resize-y"
              />
              {draftError ? (
                <p className="mt-1.5 text-sm text-red-800" role="alert">
                  {draftError}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button type="submit" className="ix-btn-primary !w-auto px-5 !py-2.5 text-sm">
                  Send response
                </button>
                <p className="text-[12px] text-ix-charcoal/50">
                  Messages stay on this page only — no AI reply is generated.
                </p>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#cfcbc3] pt-3">
              <button
                type="button"
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  micOn
                    ? "border-[#4f51b8] bg-[#4f51b8]/12 text-[#3f41a8]"
                    : "border-[#c4bfb5] bg-white text-ix-charcoal"
                }`}
                aria-pressed={micOn}
                onClick={toggleMic}
              >
                Microphone {micOn ? "on" : "off"}
              </button>
              <button
                type="button"
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  cameraOn
                    ? "border-[#4f51b8] bg-[#4f51b8]/12 text-[#3f41a8]"
                    : "border-[#c4bfb5] bg-white text-ix-charcoal"
                }`}
                aria-pressed={cameraOn}
                onClick={toggleCamera}
              >
                Camera {cameraOn ? "on" : "off"}
              </button>
              <button
                type="button"
                className="rounded-full border border-[#b45a5a]/40 bg-[#f8ecec] px-3.5 py-2 text-sm font-medium text-[#7a3030] transition hover:bg-[#f3e0e0]"
                onClick={() => setConfirmExit(true)}
              >
                End Interview
              </button>
            </div>

            {deviceNotice ? (
              <p
                className="mt-2 rounded-ix-sm border border-ix-indigo/25 bg-[#f7f6fb] px-3 py-2 text-[12px] leading-relaxed text-ix-charcoal/75"
                role="status"
              >
                {deviceNotice}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-ix-charcoal/50">
                Voice engine not connected.
              </p>
            )}
          </section>
        </main>

        <footer className="mt-4 shrink-0 border-t border-[#c9c5bc]/80 pt-3 text-center text-[11px] text-ix-charcoal/45 sm:text-left">
          © {new Date().getFullYear()} InterviewX
        </footer>
      </div>

      {confirmExit ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#17191f]/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-interview-title"
        >
          <div className="w-full max-w-md rounded-[1.25rem] border border-[#cfcbc3] bg-[#f7f6f2] p-5 shadow-[0_24px_60px_-28px_rgba(23,25,31,0.55)]">
            <h2
              id="end-interview-title"
              className="font-display text-xl tracking-tight text-ix-graphite"
            >
              End this interview?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              This practice session is local only — nothing has been recorded or
              evaluated. You will return to the dashboard.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="ix-btn-secondary px-4 py-2"
                onClick={() => setConfirmExit(false)}
              >
                Continue session
              </button>
              <button
                type="button"
                className="rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white"
                onClick={confirmEnd}
              >
                End and return
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
