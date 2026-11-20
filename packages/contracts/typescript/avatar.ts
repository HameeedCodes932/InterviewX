/** Shared AvatarAction / AvatarObservation contracts (schema_version 1). */

export type BehaviourState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "ACKNOWLEDGING"
  | "SPEAKING"
  | "QUESTIONING"
  | "NOTE_TAKING"
  | "REACTING"
  | "INTERRUPTED";

export interface AvatarAction {
  schema_version: 1;
  type: "avatar.action";
  session_id: string;
  turn_id: string;
  ts: string;
  speech: {
    text: string;
    voice_profile: string;
    expect_response: boolean;
  };
  behaviour: {
    state: BehaviourState;
    expression: string | null;
    gesture: string | null;
    gaze: string | null;
    listening_state: string | null;
    note: string | null;
  };
  meta: {
    personality: string;
    interruptible: boolean;
  };
}

export interface AvatarObservation {
  schema_version: 1;
  type: "avatar.observation";
  session_id: string;
  ts: string;
  client: {
    avatar_ready: boolean;
    lip_sync_mode: "audio" | "viseme" | "none";
    camera_permission: "granted" | "denied" | "prompt";
    mic_permission: "granted" | "denied" | "prompt";
  };
  playback: {
    speaking_visual: boolean;
    last_action_id: string | null;
  };
  vision: null;
}
