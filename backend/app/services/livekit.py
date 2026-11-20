"""Self-hosted LiveKit token + room helpers."""

from __future__ import annotations

import json
import logging
from datetime import timedelta

from livekit import api

from app.core.config import get_settings

logger = logging.getLogger("interviewx.livekit")


def create_participant_token(
    *,
    room_name: str,
    identity: str,
    name: str,
    metadata: dict | None = None,
    can_publish: bool = True,
) -> str:
    settings = get_settings()
    grant = api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=can_publish,
        can_subscribe=True,
        can_publish_data=True,
    )
    token = (
        api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(name)
        .with_grants(grant)
        .with_ttl(timedelta(hours=2))
    )
    if metadata:
        token = token.with_metadata(json.dumps(metadata))
    return token.to_jwt()


async def ensure_room_and_dispatch(
    *,
    room_name: str,
    session_id: str,
    category_slug: str,
    interviewer_gender: str | None,
    language: str,
    difficulty: str,
    candidate_name: str,
) -> None:
    settings = get_settings()
    meta = {
        "session_id": session_id,
        "category_slug": category_slug,
        "interviewer_gender": interviewer_gender,
        "language": language,
        "difficulty": difficulty,
        "candidate_name": candidate_name,
    }
    lk = api.LiveKitAPI(
        settings.livekit_url.replace("ws://", "http://").replace("wss://", "https://"),
        settings.livekit_api_key,
        settings.livekit_api_secret,
    )
    try:
        await lk.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                empty_timeout=60 * 30,
                metadata=json.dumps(meta),
            )
        )
        await lk.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=settings.livekit_agent_name,
                room=room_name,
                metadata=json.dumps(meta),
            )
        )
        logger.info("Room %s created and agent dispatched", room_name)
    except Exception:
        logger.exception(
            "LiveKit room/dispatch failed for %s — ensure livekit-server and agent worker are running",
            room_name,
        )
        raise
    finally:
        await lk.aclose()
