"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { LogoMark } from "@/components/dashboard/LogoMark";
import {
  DEFAULT_INTERVIEW_GREETING,
  InterviewApiError,
  beginOptimisticMessage,
  canCompleteInterview,
  canSubmitCandidateReply,
  completeInterviewSession,
  completeMessageSave,
  completionBlockReason,
  createInterviewMessage,
  failMessageSave,
  getInterviewSession,
  greetingClientMessageId,
  hasPendingSave,
  listInterviewMessages,
  markMessageSaving,
  messageForCompletionBlock,
  messagesFromApi,
  newClientMessageId,
  type InterviewSession,
  type RoomMessage,
} from "@/lib/interviews";
import {
  difficultyLabel,
  durationLabel,
  experienceLabel,
} from "./sessionConfig";
import type {
  DifficultyId,
  DurationMinutes,
  ExperienceLevelId,
} from "./setupOptions";

type InterviewRoomProps = {
  sessionId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; session: InterviewSession }
  | { status: "not_found"; message: string }
  | { status: "network"; message: string };

type TranscriptState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

export function InterviewRoom({ sessionId }: InterviewRoomProps) {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);
  const [trackedKey, setTrackedKey] = useState(`${sessionId}:0`);
  const requestKey = `${sessionId}:${retryToken}`;
  if (requestKey !== trackedKey) {
    setTrackedKey(requestKey);
    setLoad({ status: "loading" });
  }
  const [transcript, setTranscript] = useState<TranscriptState>({
    status: "loading",
  });
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const sendInFlight = useRef(false);
  const inputId = useId();

  useEffect(() => {
    let cancelled = false;
    setTranscript({ status: "loading" });
    setMessages([]);

    async function loadRoom() {
      let session: InterviewSession;
      try {
        session = await getInterviewSession(sessionId);
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof InterviewApiError && error.code === "not_found") {
          setLoad({ status: "not_found", message: error.message });
          return;
        }
        if (
          error instanceof InterviewApiError &&
          error.code === "unauthenticated"
        ) {
          router.replace("/login");
          return;
        }
        setLoad({
          status: "network",
          message:
            error instanceof InterviewApiError
              ? error.message
              : "Unable to load the interview session.",
        });
        return;
      }

      if (cancelled) return;
      setLoad({ status: "ready", session });

      try {
        const listed = await listInterviewMessages(sessionId);
        if (cancelled) return;

        let nextMessages = messagesFromApi(listed.items);
        if (nextMessages.length === 0 && session.status !== "completed") {
          const greetingId = greetingClientMessageId(sessionId);
          setMessages(
            beginOptimisticMessage([], {
              clientMessageId: greetingId,
              speaker: "interviewer",
              text: DEFAULT_INTERVIEW_GREETING,
            }),
          );
          const saved = await createInterviewMessage(sessionId, {
            speaker: "interviewer",
            content: DEFAULT_INTERVIEW_GREETING,
            client_message_id: greetingId,
          });
          if (cancelled) return;
          nextMessages = messagesFromApi([saved]);
        }

        setMessages(nextMessages);
        setTranscript({ status: "ready" });
      } catch (error: unknown) {
        if (cancelled) return;
        if (
          error instanceof InterviewApiError &&
          error.code === "unauthenticated"
        ) {
          router.replace("/login");
          return;
        }
        setTranscript({
          status: "error",
          message:
            error instanceof InterviewApiError
              ? error.message
              : "Unable to load the conversation.",
        });
      }
    }

    void loadRoom();

    return () => {
      cancelled = true;
    };
  }, [sessionId, retryToken, router]);

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    function syncFullscreen() {
      const active = document.fullscreenElement === roomRef.current;
      setIsFullscreen(active);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.fullscreenElement !== roomRef.current) return;
      void document.exitFullscreen().catch(() => {});
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (load.status === "loading") {
    return (
      <div className="ix-dashboard-shell flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-ix-charcoal/55">Loading interview session…</p>
      </div>
    );
  }

  if (load.status === "not_found") {
    return (
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
          <div className="ix-setup-panel text-center">
            <LogoMark className="mx-auto h-10 w-10" />
            <h1 className="mt-4 font-display text-2xl tracking-tight text-ix-graphite">
              Interview session not found
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              {load.message} Return to Interview Setup to create a new practice
              session.
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

  if (load.status === "network") {
    return (
      <div className="ix-dashboard-shell relative min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
          <div className="ix-setup-panel text-center">
            <LogoMark className="mx-auto h-10 w-10" />
            <h1 className="mt-4 font-display text-2xl tracking-tight text-ix-graphite">
              Unable to load session
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              {load.message}
            </p>
            <button
              type="button"
              className="ix-btn-primary mt-6 inline-flex"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Retry
            </button>
            <Link
              href="/interview/setup"
              className="mt-3 block text-sm text-ix-indigo hover:underline"
            >
              Back to Interview Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const session = load.session;
  const isCompleted = session.status === "completed";
  const experience = session.experience_level as ExperienceLevelId;
  const difficulty = session.difficulty as DifficultyId;
  const duration = session.duration_minutes as DurationMinutes;
  const transcriptBusy =
    transcript.status === "loading" || hasPendingSave(messages);
  const endBlockReason = isCompleted
    ? null
    : completionBlockReason(messages);
  const endBlocked = endBlockReason !== null;
  const endBlockedMessage = messageForCompletionBlock(endBlockReason);

  function requestEndInterview() {
    if (ending) return;
    if (session.status === "completed") {
      setEndError(null);
      setConfirmExit(true);
      return;
    }
    if (!canCompleteInterview(messages)) {
      setEndError(
        messageForCompletionBlock(completionBlockReason(messages)) ??
          "Save all messages before ending the interview.",
      );
      setConfirmExit(true);
      return;
    }
    setEndError(null);
    setConfirmExit(true);
  }

  async function persistMessage(input: {
    clientMessageId: string;
    speaker: "interviewer" | "candidate";
    text: string;
  }) {
    try {
      const saved = await createInterviewMessage(sessionId, {
        speaker: input.speaker,
        content: input.text,
        client_message_id: input.clientMessageId,
      });
      setMessages((current) => completeMessageSave(current, saved));
      return true;
    } catch (error: unknown) {
      if (
        error instanceof InterviewApiError &&
        error.code === "unauthenticated"
      ) {
        router.replace("/login");
        return false;
      }
      setMessages((current) =>
        failMessageSave(
          current,
          input.clientMessageId,
          error instanceof InterviewApiError
            ? error.message
            : "Unable to save the message.",
        ),
      );
      return false;
    }
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (isCompleted || ending || sendInFlight.current) return;
    if (transcript.status !== "ready") return;

    const text = draft.trim();
    if (
      !canSubmitCandidateReply({
        isCompleted,
        draft: text,
        messages,
      })
    ) {
      if (!text) setDraftError("Enter a response before sending.");
      return;
    }

    const clientMessageId = newClientMessageId();
    sendInFlight.current = true;
    setDraftError(null);
    setDraft("");
    setMessages((current) =>
      beginOptimisticMessage(current, {
        clientMessageId,
        speaker: "candidate",
        text,
      }),
    );

    try {
      await persistMessage({
        clientMessageId,
        speaker: "candidate",
        text,
      });
    } finally {
      sendInFlight.current = false;
    }
  }

  async function retryFailedMessage(message: RoomMessage) {
    if (isCompleted || ending || sendInFlight.current) return;
    if (message.status !== "failed") return;

    sendInFlight.current = true;
    setMessages((current) => markMessageSaving(current, message.clientMessageId));
    try {
      await persistMessage({
        clientMessageId: message.clientMessageId,
        speaker: message.speaker,
        text: message.text,
      });
    } finally {
      sendInFlight.current = false;
    }
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

  async function confirmEnd() {
    if (ending) return;

    if (session.status === "completed") {
      setConfirmExit(false);
      router.push("/dashboard");
      return;
    }

    const block = completionBlockReason(messages);
    if (block !== null) {
      setEndError(
        messageForCompletionBlock(block) ??
          "Save all messages before ending the interview.",
      );
      return;
    }

    setEnding(true);
    setEndError(null);
    try {
      // Re-check immediately before the network call in case a save started.
      if (!canCompleteInterview(messages)) {
        setEnding(false);
        setEndError(
          messageForCompletionBlock(completionBlockReason(messages)) ??
            "Save all messages before ending the interview.",
        );
        return;
      }
      const updated = await completeInterviewSession(sessionId);
      setLoad({ status: "ready", session: updated });
      setConfirmExit(false);
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof InterviewApiError && error.code === "unauthenticated") {
        router.replace("/login");
        return;
      }
      setEndError(
        error instanceof InterviewApiError
          ? error.message
          : "Unable to complete the interview session. Please try again.",
      );
      setEnding(false);
    }
  }

  async function toggleFullscreen() {
    const room = roomRef.current;
    if (!room) return;

    try {
      if (document.fullscreenElement === room) {
        await document.exitFullscreen();
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      await room.requestFullscreen();
    } catch {
      setDeviceNotice(
        "Fullscreen is unavailable in this browser or was blocked. Try again from the interview window control.",
      );
    }
  }

  return (
    <div
      ref={roomRef}
      className={`ix-dashboard-shell relative min-h-dvh ${
        isFullscreen ? "h-dvh overflow-y-auto" : ""
      }`}
      data-fullscreen-target="interview-room"
    >
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
            {isCompleted ? (
              <span className="rounded-full border border-[#c4bfb5] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ix-charcoal/65">
                Completed
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#c4bfb5] bg-white/80 px-3 py-1 text-xs text-ix-charcoal/65 sm:inline">
              {durationLabel(duration)} · {difficultyLabel(difficulty)}
            </span>
            <button
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                isFullscreen
                  ? "border-[#4f51b8] bg-[#4f51b8]/12 text-[#3f41a8]"
                  : "border-[#b7b2a7] bg-[#ecebe7] text-ix-charcoal hover:bg-[#e3e2dd]"
              }`}
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
            <button
              type="button"
              className="rounded-full border border-[#b7b2a7] bg-[#ecebe7] px-3 py-1.5 text-sm font-medium text-ix-charcoal transition hover:bg-[#e3e2dd] disabled:opacity-60"
              onClick={requestEndInterview}
              disabled={ending || (!isCompleted && endBlocked)}
              title={
                !isCompleted && endBlockedMessage
                  ? endBlockedMessage
                  : undefined
              }
            >
              {isCompleted ? "Leave room" : "Exit interview"}
            </button>
          </div>
        </header>

        {isCompleted ? (
          <div
            className="mt-3 rounded-ix-sm border border-ix-indigo/25 bg-[#f7f6fb] px-3.5 py-3 text-sm text-ix-charcoal/75"
            role="status"
          >
            This interview session is already completed. Conversation controls
            are closed — return to the dashboard or start a new session from
            Interview Setup.
          </div>
        ) : null}

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
                  <dd className="font-medium text-ix-graphite">{session.role}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Experience</dt>
                  <dd className="font-medium text-ix-graphite">
                    {experienceLabel(experience)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Difficulty</dt>
                  <dd className="font-medium text-ix-graphite">
                    {difficultyLabel(difficulty)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ix-charcoal/50">Duration</dt>
                  <dd className="font-medium text-ix-graphite">
                    {durationLabel(duration)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[12px] leading-relaxed text-ix-charcoal/55">
                Focus: {session.focus_areas.join(" · ")}
              </p>
            </aside>
          </section>

          <section className="ix-room-chat flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-[#cfcbc3] px-1 pb-2">
              <h2 className="font-display text-[1.15rem] tracking-tight text-ix-graphite">
                Conversation
              </h2>
              <span className="text-[11px] font-medium text-ix-charcoal/50">
                {transcript.status === "loading"
                  ? "Loading transcript…"
                  : isCompleted
                    ? "Read-only transcript"
                    : "Saved to your account"}
              </span>
            </div>

            <div
              ref={transcriptRef}
              className="mt-3 flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto pr-1 sm:min-h-[260px] lg:min-h-0"
              aria-live="polite"
            >
              {transcript.status === "loading" ? (
                <p className="text-sm text-ix-charcoal/55">
                  Loading saved conversation…
                </p>
              ) : null}
              {transcript.status === "error" ? (
                <div className="rounded-[1rem] border border-[#d8c2c2] bg-[#fbf5f5] px-3.5 py-3">
                  <p className="text-sm text-red-800">{transcript.message}</p>
                  <button
                    type="button"
                    className="mt-2 rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white"
                    onClick={() => setRetryToken((value) => value + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : null}
              {transcript.status === "ready" && messages.length === 0 ? (
                <p className="text-sm text-ix-charcoal/55">
                  No messages were saved for this session.
                </p>
              ) : null}
              {messages.map((message) => (
                <div
                  key={message.clientMessageId}
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
                  {message.status === "saving" ? (
                    <p className="mt-1.5 text-[11px] text-ix-charcoal/50">
                      Saving…
                    </p>
                  ) : null}
                  {message.status === "failed" ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-[11px] text-red-800" role="alert">
                        {message.error ?? "Save failed."}
                      </p>
                      <button
                        type="button"
                        className="rounded-full bg-ix-graphite px-3 py-1 text-[11px] font-medium text-white"
                        onClick={() => {
                          void retryFailedMessage(message);
                        }}
                      >
                        Retry save
                      </button>
                    </div>
                  ) : null}
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
                placeholder={
                  isCompleted
                    ? "This session is completed."
                    : "Type your response…"
                }
                className="ix-field min-h-[5.5rem] resize-y"
                disabled={isCompleted || ending || transcriptBusy}
              />
              {draftError ? (
                <p className="mt-1.5 text-sm text-red-800" role="alert">
                  {draftError}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="ix-btn-primary !w-auto px-5 !py-2.5 text-sm"
                  disabled={isCompleted || ending || transcriptBusy}
                >
                  {hasPendingSave(messages) ? "Saving…" : "Send response"}
                </button>
                <p className="text-[12px] text-ix-charcoal/50">
                  {isCompleted
                    ? "Completed sessions are read-only."
                    : "Answers are saved to the server. No AI reply is generated yet."}
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
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  isFullscreen
                    ? "border-[#4f51b8] bg-[#4f51b8]/12 text-[#3f41a8]"
                    : "border-[#c4bfb5] bg-white text-ix-charcoal"
                }`}
                aria-pressed={isFullscreen}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? "Exit full screen" : "Full screen"}
              </button>
              <button
                type="button"
                className="rounded-full border border-[#b45a5a]/40 bg-[#f8ecec] px-3.5 py-2 text-sm font-medium text-[#7a3030] transition hover:bg-[#f3e0e0] disabled:opacity-60"
                onClick={requestEndInterview}
                disabled={ending || (!isCompleted && endBlocked)}
                title={
                  !isCompleted && endBlockedMessage
                    ? endBlockedMessage
                    : undefined
                }
              >
                {isCompleted ? "Leave room" : "End Interview"}
              </button>
            </div>
            {!isCompleted && endBlockedMessage ? (
              <p className="mt-2 text-[12px] text-[#7a3030]" role="status">
                {endBlockedMessage}
              </p>
            ) : null}

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
              {isCompleted ? "Leave this room?" : "End this interview?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ix-charcoal/65">
              {isCompleted
                ? "This session is already marked completed. You will return to the dashboard."
                : "This will mark the interview session as completed and return you to the dashboard. Messages already saved on the server remain available when you reopen this interview."}
            </p>
            {endBlockedMessage ? (
              <p className="mt-3 text-sm text-[#7a3030]" role="status">
                {endBlockedMessage}
              </p>
            ) : null}
            {endError ? (
              <p className="mt-3 text-sm text-red-800" role="alert">
                {endError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="ix-btn-secondary px-4 py-2"
                onClick={() => {
                  if (ending) return;
                  setConfirmExit(false);
                  setEndError(null);
                }}
                disabled={ending}
              >
                {isCompleted ? "Stay" : "Continue session"}
              </button>
              <button
                type="button"
                className="rounded-full bg-ix-graphite px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={() => {
                  void confirmEnd();
                }}
                disabled={ending || (!isCompleted && endBlocked)}
              >
                {ending
                  ? "Ending…"
                  : isCompleted
                    ? "Return to dashboard"
                    : "End and return"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
