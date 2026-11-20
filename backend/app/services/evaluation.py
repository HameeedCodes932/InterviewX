"""Post-session SE evaluation: scored rubric + qualitative feedback with evidence."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger("interviewx.eval")

SE_DIMENSIONS = [
    {
        "id": "technical_depth",
        "name": "Technical depth",
        "description": "Correctness and depth of technical explanations",
    },
    {
        "id": "problem_solving",
        "name": "Problem solving",
        "description": "Structured approach to problems and trade-off reasoning",
    },
    {
        "id": "communication",
        "name": "Communication",
        "description": "Clarity, structure, and professional articulation",
    },
    {
        "id": "system_design",
        "name": "System design awareness",
        "description": "Scalability, reliability, and design trade-offs when relevant",
    },
    {
        "id": "collaboration",
        "name": "Collaboration & ownership",
        "description": "Teamwork, ownership, and behavioural judgment",
    },
]


def _heuristic_report(transcript: list[dict[str, str]]) -> dict[str, Any]:
    """Offline fallback when Ollama is unavailable — still evidence-linked."""
    candidate_turns = [t for t in transcript if t.get("role") == "candidate"]
    evidence = []
    for i, turn in enumerate(candidate_turns[:5]):
        evidence.append(
            {
                "turn_index": turn.get("turn_index", i),
                "quote": (turn.get("text") or "")[:240],
            }
        )
    if not evidence:
        evidence = [{"turn_index": 0, "quote": "(No candidate answers recorded)"}]

    scores = []
    for dim in SE_DIMENSIONS:
        score = 3.0 if candidate_turns else 0.0
        if candidate_turns and len(" ".join(t.get("text", "") for t in candidate_turns)) > 400:
            score = 4.0
        scores.append(
            {
                "dimension_id": dim["id"],
                "name": dim["name"],
                "score": score,
                "max_score": 5,
                "rationale": (
                    "Heuristic score based on answer volume; regenerate with Ollama for richer feedback."
                    if candidate_turns
                    else "No candidate answers — dimension not demonstrated."
                ),
                "evidence": evidence[:2] if candidate_turns else [],
            }
        )

    overall = (
        round(sum(s["score"] for s in scores) / len(scores), 2) if candidate_turns else 0.0
    )
    return {
        "overall_score": overall,
        "summary": (
            "Interview completed. Scores are heuristic because the evaluation LLM was unavailable."
            if candidate_turns
            else "Session ended without candidate answers; scores are zero."
        ),
        "qualitative": (
            "Practice elaborating with concrete examples, trade-offs, and measurable outcomes. "
            "Ensure Ollama is running for full qualitative evaluation next time."
        ),
        "rubric": {"dimensions": scores, "scale": "0-5", "generator": "heuristic"},
    }


async def generate_se_evaluation(transcript: list[dict[str, str]]) -> dict[str, Any]:
    settings = get_settings()
    if not transcript:
        return _heuristic_report([])

    numbered = "\n".join(
        f"[{t.get('turn_index', i)}] {t.get('role', '?').upper()}: {t.get('text', '')}"
        for i, t in enumerate(transcript)
    )
    dims = ", ".join(d["id"] for d in SE_DIMENSIONS)
    prompt = f"""You are an interview evaluator for Software Engineering interviews.
Score only dimensions that have evidence in the transcript. Do not invent scores for unanswered topics.
Return ONLY valid JSON with this shape:
{{
  "overall_score": <float 0-5>,
  "summary": "<2-3 sentence summary>",
  "qualitative": "<detailed qualitative feedback paragraph>",
  "rubric": {{
    "dimensions": [
      {{
        "dimension_id": "<one of: {dims}>",
        "name": "<human name>",
        "score": <0-5 number or null if not evidenced>,
        "max_score": 5,
        "rationale": "<why this score>",
        "evidence": [{{"turn_index": <int>, "quote": "<short quote from transcript>"}}]
      }}
    ]
  }}
}}

Transcript:
{numbered}
"""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            res = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/chat",
                json={
                    "model": settings.ollama_model,
                    "stream": False,
                    "format": "json",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You evaluate software engineering interviews. Reply with JSON only.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                },
            )
            res.raise_for_status()
            content = res.json()["message"]["content"]
            content = re.sub(r"^```(?:json)?\s*", "", content.strip())
            content = re.sub(r"\s*```$", "", content)
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                start = content.find("{")
                data, _ = json.JSONDecoder().raw_decode(content[start:])
            normalized = _normalize_report(data, transcript)
            normalized["rubric"]["generator"] = "ollama"
            normalized["rubric"]["model"] = settings.ollama_model
            return normalized
    except Exception:
        logger.exception("Ollama evaluation failed; using heuristic fallback")
        return _heuristic_report(transcript)


def _normalize_report(data: dict[str, Any], transcript: list[dict[str, str]]) -> dict[str, Any]:
    """Accept either the preferred dimensions[] shape or a flat score map from small models."""
    candidate_turns = [t for t in transcript if t.get("role") == "candidate"]
    evidence = [
        {
            "turn_index": t.get("turn_index", i),
            "quote": (t.get("text") or "")[:240],
        }
        for i, t in enumerate(candidate_turns[:3])
    ]

    rubric = data.get("rubric") or {}
    dimensions = rubric.get("dimensions") if isinstance(rubric, dict) else None

    if not dimensions and isinstance(rubric, dict):
        dimensions = []
        for dim in SE_DIMENSIONS:
            raw_score = rubric.get(dim["id"])
            if raw_score is None:
                continue
            try:
                score = float(raw_score)
            except (TypeError, ValueError):
                continue
            dimensions.append(
                {
                    "dimension_id": dim["id"],
                    "name": dim["name"],
                    "score": score,
                    "max_score": 5,
                    "rationale": data.get("qualitative")
                    or "Score produced by local evaluation model.",
                    "evidence": evidence[:2] if candidate_turns else [],
                }
            )

    if not dimensions:
        return _heuristic_report(transcript)

    scores = [d["score"] for d in dimensions if d.get("score") is not None]
    overall = data.get("overall_score")
    if overall is None and scores:
        overall = round(sum(float(s) for s in scores) / len(scores), 2)

    return {
        "overall_score": float(overall or 0),
        "summary": data.get("summary") or "Evaluation complete.",
        "qualitative": data.get("qualitative")
        or "See dimension rationales and evidence quotes below.",
        "rubric": {"dimensions": dimensions, "scale": "0-5"},
    }
