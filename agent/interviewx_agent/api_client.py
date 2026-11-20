from __future__ import annotations

import logging

import httpx

from interviewx_agent.adapters.base import UsageDelta

logger = logging.getLogger("interviewx.api")


class BackendClient:
    def __init__(self, base_url: str, agent_api_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.headers = {"X-Agent-Key": agent_api_key, "Content-Type": "application/json"}

    async def bootstrap(self, session_id: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(
                f"{self.base_url}/api/interviews/{session_id}/bootstrap",
                headers=self.headers,
            )
            res.raise_for_status()
            return res.json()

    async def append_transcript(
        self, session_id: str, role: str, text: str, turn_index: int | None = None
    ) -> None:
        body: dict = {"role": role, "text": text}
        if turn_index is not None:
            body["turn_index"] = turn_index
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"{self.base_url}/api/interviews/{session_id}/transcript",
                headers=self.headers,
                json=body,
            )
            res.raise_for_status()

    async def record_usage(self, session_id: str, usage: UsageDelta) -> None:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"{self.base_url}/api/interviews/{session_id}/usage",
                headers=self.headers,
                json={
                    "provider": usage.provider,
                    "metric": usage.metric,
                    "quantity": usage.quantity,
                    "unit": usage.unit,
                    "estimated_cost_usd": usage.estimated_cost_usd,
                    "meta": usage.meta,
                },
            )
            if res.status_code >= 400:
                logger.warning("usage record failed: %s", res.text)

    async def end_session(self, session_id: str, reason: str = "agent_ended") -> None:
        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(
                f"{self.base_url}/api/interviews/{session_id}/agent-end",
                headers=self.headers,
                json={"reason": reason},
            )
            res.raise_for_status()
