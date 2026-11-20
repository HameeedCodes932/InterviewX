"""Software Engineering interview brain — adaptive questions + session memory."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

from interviewx_agent.adapters.base import LLMAdapter, UsageDelta

logger = logging.getLogger("interviewx.brain")

SYSTEM_PROMPT = """You are InterviewX, a professional Software Engineering interviewer.
Conduct a realistic interview in English (v0). Be concise when speaking — this will be read aloud via TTS.
Personality: professional, fair, curious. Ask one question at a time.
Adapt follow-ups to the candidate's last answer. Use session memory.
Cover a mix of technical depth, problem solving, system design awareness, and collaboration.
Do not invent candidate history. If interrupted, gracefully acknowledge and continue.
When ending, thank the candidate briefly.

Always reply with JSON only:
{
  "speech": "<what you say aloud>",
  "expect_response": true/false,
  "done": true/false,
  "behaviour_state": "SPEAKING|QUESTIONING|LISTENING|THINKING",
  "note": "<optional private note>"
}
"""


@dataclass
class BrainDecision:
    speech: str
    expect_response: bool = True
    done: bool = False
    behaviour_state: str = "SPEAKING"
    note: str | None = None
    usage: UsageDelta | None = None


@dataclass
class SessionMemory:
    candidate_name: str
    category_slug: str
    difficulty: str
    language: str
    turns: list[dict[str, str]] = field(default_factory=list)
    question_count: int = 0

    def add(self, role: str, text: str) -> None:
        self.turns.append({"role": role, "text": text})
        if role == "interviewer":
            self.question_count += 1


class InterviewBrain:
    def __init__(self, llm: LLMAdapter, max_questions: int = 6) -> None:
        self.llm = llm
        self.max_questions = max_questions

    async def greeting(self, memory: SessionMemory) -> BrainDecision:
        user = (
            f"Start the interview. Candidate name: {memory.candidate_name}. "
            f"Category: {memory.category_slug}. Difficulty: {memory.difficulty}. "
            f"Language: {memory.language}. Greet briefly and ask the first SE question."
        )
        return await self._decide(memory, user)

    async def next_turn(self, memory: SessionMemory, candidate_text: str) -> BrainDecision:
        memory.add("candidate", candidate_text)
        if memory.question_count >= self.max_questions:
            user = (
                "The interview should wrap up now. Thank the candidate and end. "
                f"Last answer: {candidate_text}"
            )
        else:
            user = (
                "Continue the interview with an adaptive follow-up or next question. "
                f"Last candidate answer: {candidate_text}\n"
                f"Questions asked so far: {memory.question_count}/{self.max_questions}."
            )
        return await self._decide(memory, user)

    async def interrupted(self, memory: SessionMemory) -> BrainDecision:
        user = (
            "The candidate interrupted you. Briefly acknowledge, then continue or "
            "re-ask the last question succinctly."
        )
        return await self._decide(memory, user)

    async def _decide(self, memory: SessionMemory, user_prompt: str) -> BrainDecision:
        history = "\n".join(f"{t['role']}: {t['text']}" for t in memory.turns[-12:])
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Session memory:\n{history or '(empty)'}\n\n{user_prompt}",
            },
        ]
        try:
            raw, usage = await self.llm.complete(messages)
            data = _parse_json(raw)
            speech = str(data.get("speech") or raw).strip()
            decision = BrainDecision(
                speech=speech,
                expect_response=bool(data.get("expect_response", True)),
                done=bool(data.get("done", False)),
                behaviour_state=str(data.get("behaviour_state") or "SPEAKING"),
                note=data.get("note"),
                usage=usage,
            )
        except Exception:
            logger.exception("Brain LLM failed; using fallback question")
            decision = BrainDecision(
                speech=_fallback_speech(memory),
                expect_response=True,
                done=memory.question_count >= self.max_questions,
                behaviour_state="QUESTIONING",
                usage=None,
            )

        memory.add("interviewer", decision.speech)
        return decision


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Take the first JSON object if the model appended extra text
    start = raw.find("{")
    if start >= 0:
        try:
            obj, _end = json.JSONDecoder().raw_decode(raw[start:])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
    return {"speech": raw, "expect_response": True, "done": False}


def _fallback_speech(memory: SessionMemory) -> str:
    prompts = [
        f"Welcome {memory.candidate_name}. Let's begin — tell me about a challenging software project you owned recently.",
        "Thanks. How did you decide on the architecture, and what trade-offs did you consider?",
        "Walk me through how you would design a URL shortener that handles high read traffic.",
        "Describe a production incident you helped resolve. What was your role?",
        "How do you approach testing and quality for services you ship?",
        "That covers our main topics. Thank you for your time today — we'll end the interview here.",
    ]
    idx = min(memory.question_count, len(prompts) - 1)
    return prompts[idx]
