"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import type { AvatarBehaviourState, InterviewerGender } from "@interviewx/avatar";
import { ConnectionState, RoomEvent } from "livekit-client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { InterviewAvatarViewport } from "@/components/InterviewAvatarViewport";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type SessionDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getMessages, t } from "@/lib/i18n";

function parseGender(value: string | null | undefined): InterviewerGender {
  return value === "male" ? "male" : "female";
}

function InterviewRoomInner() {
  const params = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const { token: authToken } = useAuth();
  const router = useRouter();
  const m = getMessages();

  const livekitUrl =
    search.get("url") ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "ws://localhost:7880";
  const livekitToken = search.get("token") || "";
  const genderFromQuery = search.get("gender");

  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [behaviourState, setBehaviourState] =
    useState<AvatarBehaviourState>("IDLE");
  const [gender, setGender] = useState<InterviewerGender>(
    parseGender(genderFromQuery),
  );

  useEffect(() => {
    if (!authToken || !params.sessionId) return;
    api
      .getInterview(authToken, params.sessionId)
      .then((detail) => {
        if (detail.interviewer_gender) {
          setGender(parseGender(detail.interviewer_gender));
        }
      })
      .catch(() => {
        /* room can still run on query gender */
      });
  }, [authToken, params.sessionId]);

  if (!livekitToken) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-700">Missing LiveKit token. Start again from the dashboard.</p>
        <Link href="/dashboard" className="btn-secondary mt-4 inline-flex">
          {t(m, "nav.dashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="atmosphere-layer" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl text-ink">{t(m, "brand.name")}</p>
            <p className="text-sm text-ink-muted">{t(m, "interview.roomTitle")}</p>
          </div>
          <Link href="/dashboard" className="text-sm text-teal hover:underline">
            {t(m, "nav.dashboard")}
          </Link>
        </header>

        <LiveKitRoom
          token={livekitToken}
          serverUrl={livekitUrl}
          connect
          audio
          video={false}
          className="flex flex-1 flex-col"
          onError={(err) => setError(err.message)}
        >
          <RoomAudioRenderer />
          <RoomBody
            sessionId={params.sessionId}
            authToken={authToken}
            gender={gender}
            behaviourState={behaviourState}
            setBehaviourState={setBehaviourState}
            ending={ending}
            setEnding={setEnding}
            error={error}
            setError={setError}
            lastAction={lastAction}
            setLastAction={setLastAction}
            onEnded={(reportId) => {
              if (reportId) router.replace(`/reports/${reportId}`);
              else router.replace("/history");
            }}
          />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function RoomBody({
  sessionId,
  authToken,
  gender,
  behaviourState,
  setBehaviourState,
  ending,
  setEnding,
  error,
  setError,
  lastAction,
  setLastAction,
  onEnded,
}: {
  sessionId: string;
  authToken: string | null;
  gender: InterviewerGender;
  behaviourState: AvatarBehaviourState;
  setBehaviourState: (s: AvatarBehaviourState) => void;
  ending: boolean;
  setEnding: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  lastAction: string | null;
  setLastAction: (v: string | null) => void;
  onEnded: (reportId: string | null) => void;
}) {
  const m = getMessages();
  const room = useRoomContext();
  const connection = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg?.type === "avatar.action") {
          if (msg?.speech?.text) {
            setLastAction(String(msg.speech.text));
          }
          const state = msg?.behaviour?.state as AvatarBehaviourState | undefined;
          if (state) setBehaviourState(state);
        }
      } catch {
        /* ignore */
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, setLastAction, setBehaviourState]);

  const endInterview = useCallback(async () => {
    if (!authToken || ending) return;
    setEnding(true);
    try {
      await room.disconnect();
      const detail: SessionDetail = await api.endInterview(authToken, sessionId);
      onEnded(detail.report_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end interview");
      setEnding(false);
    }
  }, [authToken, ending, onEnded, room, sessionId, setEnding, setError]);

  const interviewerLabel =
    gender === "male" ? t(m, "profile.male") : t(m, "profile.female");

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-mist/85 shadow-soft backdrop-blur">
      <div className="relative h-[min(52vh,420px)] w-full overflow-hidden border-b border-ink/10 sm:h-[min(56vh,480px)]">
        <InterviewAvatarViewport
          gender={gender}
          behaviourState={behaviourState}
          className="h-full w-full"
        />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-ink/55 px-2.5 py-1 text-xs text-mist">
          {interviewerLabel} · {behaviourState.toLowerCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center sm:px-8">
        <p className="text-sm uppercase tracking-wide text-ink-muted">
          {connection === ConnectionState.Connected
            ? t(m, "interview.connected")
            : t(m, "interview.connecting")}
        </p>
        <p className="mt-3 max-w-xl font-display text-xl text-ink sm:text-2xl">
          {lastAction || t(m, "interview.waiting")}
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Mic: {isMicrophoneEnabled ? t(m, "interview.micOn") : t(m, "interview.micOff")}
        </p>
      </div>

      {error ? <p className="mb-2 px-6 text-center text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-center gap-3 px-6 pb-6">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        >
          {isMicrophoneEnabled ? t(m, "interview.mute") : t(m, "interview.unmute")}
        </button>
        <button
          type="button"
          className="btn-primary bg-red-900 hover:bg-red-800"
          disabled={ending}
          onClick={endInterview}
        >
          {ending ? "…" : t(m, "interview.end")}
        </button>
      </div>
    </section>
  );
}

export default function InterviewPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="p-10 text-ink-muted">Loading interview…</div>}>
        <InterviewRoomInner />
      </Suspense>
    </RequireAuth>
  );
}
