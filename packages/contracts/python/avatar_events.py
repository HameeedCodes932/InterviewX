"""Shared AvatarAction / AvatarObservation contracts (schema_version 1)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

BehaviourState = Literal[
    "IDLE",
    "LISTENING",
    "THINKING",
    "ACKNOWLEDGING",
    "SPEAKING",
    "QUESTIONING",
    "NOTE_TAKING",
    "REACTING",
    "INTERRUPTED",
]


class SpeechPayload(BaseModel):
    text: str
    voice_profile: str
    expect_response: bool


class BehaviourPayload(BaseModel):
    state: BehaviourState
    expression: str | None = None
    gesture: str | None = None
    gaze: str | None = None
    listening_state: str | None = None
    note: str | None = None


class MetaPayload(BaseModel):
    personality: str
    interruptible: bool


class AvatarAction(BaseModel):
    schema_version: Literal[1] = 1
    type: Literal["avatar.action"] = "avatar.action"
    session_id: str
    turn_id: str
    ts: str
    speech: SpeechPayload
    behaviour: BehaviourPayload
    meta: MetaPayload


class ClientPayload(BaseModel):
    avatar_ready: bool
    lip_sync_mode: Literal["audio", "viseme", "none"]
    camera_permission: Literal["granted", "denied", "prompt"]
    mic_permission: Literal["granted", "denied", "prompt"]


class PlaybackPayload(BaseModel):
    speaking_visual: bool
    last_action_id: str | None = None


class AvatarObservation(BaseModel):
    schema_version: Literal[1] = 1
    type: Literal["avatar.observation"] = "avatar.observation"
    session_id: str
    ts: str
    client: ClientPayload
    playback: PlaybackPayload
    vision: None = None
