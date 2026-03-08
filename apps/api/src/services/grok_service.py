import json
import re
import httpx
from typing import Optional, Any
import logging
from ..core.config import get_settings

logger = logging.getLogger(__name__)

# Inlined JSON schema for xAI structured output (no $ref, no minItems/maxItems/minLength/maxLength)
_SCORE_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "logic_score": {"type": "integer", "description": "Logic score 1-10"},
        "historical_accuracy_score": {
            "type": "integer",
            "description": "Historical accuracy score 1-10",
        },
        "rhetoric_score": {"type": "integer", "description": "Rhetoric score 1-10"},
        "rebuttal_score": {"type": "integer", "description": "Rebuttal score 1-10"},
        "logic_reason": {
            "type": "string",
            "description": "1-2 sentences explaining the logic score",
        },
        "historical_reason": {
            "type": "string",
            "description": "1-2 sentences explaining historical accuracy",
        },
        "rhetoric_reason": {
            "type": "string",
            "description": "1-2 sentences explaining the rhetoric score",
        },
        "rebuttal_reason": {
            "type": "string",
            "description": "1-2 sentences explaining the rebuttal score",
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "description": "What the user did well",
        },
        "improvements": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Suggestions for improvement",
        },
        "claim_checks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["accurate", "mischaracterized", "ignored"],
                        "description": "Type of claim check",
                    },
                    "note": {"type": "string", "description": "Short specific note"},
                },
                "required": ["type", "note"],
                "additionalProperties": False,
            },
            "description": "Claim validation notes",
        },
        "source_used_well": {
            "type": "boolean",
            "description": "Whether user used sources well",
        },
    },
    "required": [
        "logic_score",
        "historical_accuracy_score",
        "rhetoric_score",
        "rebuttal_score",
        "logic_reason",
        "historical_reason",
        "rhetoric_reason",
        "rebuttal_reason",
        "strengths",
        "improvements",
        "source_used_well",
    ],
    "additionalProperties": False,
}


def _coerce_score(val: Any) -> int:
    """Coerce a score value to an integer 1-10. Handles strings, floats, and malformed input."""
    if isinstance(val, int) and 1 <= val <= 10:
        return val
    if isinstance(val, float) and 1 <= val <= 10:
        return int(round(val))
    if isinstance(val, str):
        # Try to extract leading integer (e.g. "8. Some text" or "10 / 10")
        match = re.match(r"^(\d{1,2})", str(val).strip())
        if match:
            n = int(match.group(1))
            return max(1, min(10, n))
    return 5  # Fallback for unparseable values


class GrokService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.settings = get_settings()
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.settings.grok_base_url,
                headers={
                    "Authorization": f"Bearer {self.settings.grok_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=60.0,
            )
        return self._client

    async def generate_response(
        self,
        system_prompt: str,
        context: str,
        topic: str,
        debate_history: list[dict],
        user_argument: str,
        figure_name: str,
        temperature: float = 0.8,
        max_tokens: int = 600,
    ) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": f"DEBATE TOPIC: {topic}"},
        ]

        if context:
            messages.append(
                {
                    "role": "system",
                    "content": f"""RELEVANT PASSAGES FROM YOUR WORKS:

{context}

CITATION RULE: When referencing your works, quote or paraphrase specific passages. Use format: [As I wrote in Chapter X: '...'] or [In my words: ...]. If a claim is general rather than from a specific passage, acknowledge that you are speaking from your broader view.""",
                }
            )

        structure_rule = """RESPONSE STRUCTURE: Address their strongest point first. For each main claim: (1) Quote or paraphrase what they said. (2) Agree, disagree, or qualify. (3) Give your view with citation from your works. Stay in character."""
        messages.append({"role": "system", "content": structure_rule})

        messages.extend(debate_history)

        messages.append(
            {
                "role": "user",
                "content": f"Your opponent argues:\n\n{user_argument}\n\nRespond as {figure_name}, tackling their arguments directly. Reference your writings where relevant. Stay in character.",
            }
        )

        response = await self.client.post(
            "/chat/completions",
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )

        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise ValueError("No choices in Grok response")
        msg = choices[0].get("message", {}).get("content")
        if msg is None:
            raise ValueError("Empty message content from Grok")
        return msg

    async def extract_key_claims(
        self, figure_response: str, figure_name: str
    ) -> list[str]:
        """Extract 2-4 key claims from the figure's response for rebuttal challenge."""
        if not figure_response or len(figure_response.strip()) < 50:
            return []
        prompt = f"""Extract 2-4 short, distinct claims (each one sentence max) from this response by {figure_name}.
Return ONLY a JSON array of strings, e.g. ["Claim 1.", "Claim 2."]
Response:
{figure_response[:1500]}"""
        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": "grok-4-1-fast-non-reasoning",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 200,
                },
            )
            response.raise_for_status()
            content = (
                response.json()
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content")
                or "[]"
            )
            claims = json.loads(content)
            if isinstance(claims, list) and all(isinstance(c, str) for c in claims):
                return [c.strip() for c in claims[:4] if c.strip()]
            return []
        except Exception as exc:
            logger.warning("Key-claim extraction failed: %s", exc, exc_info=True)
            return []

    async def score_argument(
        self,
        user_argument: str,
        figure_response: str,
        topic: str,
        sources: list[str],
        figure_name: str,
        passages: list[dict] | None = None,
        previous_figure_response: str | None = None,
    ) -> dict:
        passages_block = ""
        if passages:
            excerpts = "\n\n".join(
                f"--- {p.get('title', '')} ---\n{p.get('text_excerpt', '')}"
                for p in passages
            )
            passages_block = f"""
PASSAGES FROM {figure_name.upper()}'S WORKS (that informed the response):
{excerpts}

Check if the user's claims align with or contradict these passages. Historical accuracy = fidelity to these texts.
"""

        rebuttal_block = ""
        if previous_figure_response:
            rebuttal_block = f"""

WHAT {figure_name.upper()} SAID BEFORE (that the user is responding to):
{previous_figure_response}

REBUTTAL SCORE: Rate 1-10 how well the user directly addressed the figure's previous counter-argument—did they engage with specific claims or just talk past them?"""
        else:
            rebuttal_block = """

REBUTTAL SCORE: Rate 1-10 how well the user engaged with the opening or prior exchange. If unclear, use 5."""

        scoring_prompt = f"""You are a debate judge evaluating a user's argument against {figure_name}.

USER'S ARGUMENT:
{user_argument}

{figure_name.upper()}'S RESPONSE (to the user):
{figure_response}

DEBATE TOPIC: {topic}
RELEVANT SOURCES: {", ".join(sources) if sources else "None"}{passages_block}{rebuttal_block}

Score the user's argument on a 1-10 scale for each category.
Be EDUCATIONAL: scores should encourage learning.
- Award partial credit for good reasoning even if not perfect
- Highlight what they did well
- Gently note areas for improvement
- Historical accuracy: rate how well the user's claims match or engage with the passages above (if provided)

CRITICAL: Only describe rhetoric and phrases that appear in the USER'S ARGUMENT. Do not attribute quotes, rhetorical devices, or stylistic choices to the user that are not in their text. Do not describe the figure's style as if it were the user's.

CLAIM-CHECK: If the user cited or engaged with specific passages, add to claim_checks:
- "accurate": User correctly represented a passage (e.g. "You accurately engaged with Chapter 17 on fear vs love.")
- "mischaracterized": User got a passage wrong (e.g. "Your summary of Socrates' view in Crito was off—he argues obedience to the Laws, not mere custom.")
- "ignored": User could have addressed a key passage but did not (optional, 0-1 items)
Use short, specific notes. Omit claim_checks if no passages or no relevant engagement.

Respond with valid JSON matching the required schema."""

        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "score_result",
                "strict": True,
                "schema": _SCORE_RESPONSE_SCHEMA,
            },
        }

        response = await self.client.post(
            "/chat/completions",
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{"role": "user", "content": scoring_prompt}],
                "temperature": 0.3,
                "max_tokens": 650,
                "response_format": response_format,
            },
        )

        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise ValueError("No choices in Grok response")
        content = choices[0].get("message", {}).get("content")
        if content is None:
            raise ValueError("Empty message content from Grok")

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning("Grok scoring JSON parse failed: %s", e, exc_info=True)
            return {
                "scores": None,
                "scores_error": "Scoring unavailable — response format invalid",
            }

        # Validate and sanitize scores so frontend never receives strings
        if isinstance(parsed, dict):
            for key in (
                "logic_score",
                "historical_accuracy_score",
                "rhetoric_score",
                "rebuttal_score",
            ):
                if key in parsed:
                    parsed[key] = _coerce_score(parsed[key])

        return parsed

    async def generate_learning_summary(
        self,
        figure_name: str,
        topic: str,
        turns: list[dict],
        passages: list[dict],
    ) -> dict:
        """Generate a learning summary and suggested readings after a debate."""
        turns_text = "\n\n".join(
            f"Turn {t.get('turn_number', i + 1)}:\nYou: {t.get('user_argument', '')}\n{figure_name}: {t.get('figure_response', '')}"
            for i, t in enumerate(turns)
        )
        passages_text = (
            "\n\n".join(
                f"- {p.get('title', '')}: {p.get('text_excerpt', '')[:200]}..."
                for p in passages[:5]
            )
            if passages
            else "None cited"
        )

        prompt = f"""After this debate with {figure_name} on "{topic}", provide a learning summary.

DEBATE:
{turns_text}

PASSAGES USED:
{passages_text}

Respond with valid JSON only:
{{
  "summary": "<2-3 sentences: what the user did well, key improvements, main takeaway. Include one concrete insight about {figure_name}'s position on this topic that the user can remember>",
  "key_takeaway": "<One memorable insight: e.g. 'Machiavelli distinguishes fear from hatred—rulers must avoid hatred.'>",
  "suggested_readings": [{{"title": "<source title>", "reason": "<why read this>", "source_id": "<chapter/section id if available>"}}]
}}
Keep suggested_readings to 2-3 items. Add source_id (e.g. chapter number) when possible for "continue learning" links."""

        response = await self.client.post(
            "/chat/completions",
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "max_tokens": 400,
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content") or "{}"

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.warning("Learning summary parse failed: %s", exc, exc_info=True)
            return {
                "summary": "Reflect on the debate and the passages cited.",
                "suggested_readings": [],
            }

    async def generate_position_primer(
        self,
        figure_name: str,
        topic: str,
        passages: list[dict],
    ) -> dict:
        """Generate a short position primer: what the figure argues + sample quote + user task."""
        passages_text = (
            "\n\n".join(
                f'- {p.get("title", "")}: "{p.get("text_excerpt", "")[:300]}..."'
                for p in passages[:3]
            )
            if passages
            else "No specific passages."
        )
        prompt = f"""Given this topic and passages from {figure_name}'s works, provide a brief position primer.

TOPIC: {topic}

PASSAGES FROM {figure_name}'S WORKS:
{passages_text}

Respond with valid JSON only:
{{
  "position_summary": "<2-3 sentences: On this topic, {figure_name} typically argues...>",
  "sample_quote": "<One short, impactful quote (1-2 sentences) from the passages above>",
  "user_task": "Your job: argue against this position using evidence from their own words where possible."
}}"""
        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": "grok-4-1-fast-non-reasoning",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                    "max_tokens": 300,
                },
            )
            response.raise_for_status()
            content = (
                response.json()
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content")
                or "{}"
            )

            return json.loads(content)
        except Exception as exc:
            logger.warning("Position primer generation failed: %s", exc, exc_info=True)
            return {
                "position_summary": f"On this topic, {figure_name} will present their view. Engage with their arguments directly.",
                "sample_quote": None,
                "user_task": "Your job: argue against this position using evidence from their own words where possible.",
            }

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


grok_service = GrokService()
