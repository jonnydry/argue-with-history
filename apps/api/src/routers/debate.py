from fastapi import APIRouter, HTTPException, Request
from typing import Dict
import os
import uuid
import time
import asyncio
import logging
from ..core.limiter import limiter
from ..models.schemas import (
    StartDebateRequest,
    SubmitArgumentRequest,
    DebateState,
    DebateTurn,
    Passage,
)
from ..models.figures import FIGURES_DATA
from ..services.grok_service import grok_service
from ..services.retrieval_service import retrieval_service
from ..services.prompts import get_persona_prompt
from ..services.persistence import debate_persistence

router = APIRouter(prefix="/debate", tags=["debate"])
logger = logging.getLogger(__name__)

# Per-debate locks with refcounts to avoid lock-map growth over time.
_debate_locks: Dict[str, Dict[str, object]] = {}
_lock_factory = asyncio.Lock()


async def _acquire_debate_lock(debate_id: str) -> asyncio.Lock:
    async with _lock_factory:
        entry = _debate_locks.get(debate_id)
        if not entry:
            entry = {"lock": asyncio.Lock(), "ref_count": 0}
            _debate_locks[debate_id] = entry
        entry["ref_count"] = int(entry["ref_count"]) + 1
        return entry["lock"]  # type: ignore[return-value]


async def _release_debate_lock(debate_id: str) -> None:
    async with _lock_factory:
        entry = _debate_locks.get(debate_id)
        if not entry:
            return
        next_count = int(entry["ref_count"]) - 1
        if next_count <= 0:
            _debate_locks.pop(debate_id, None)
        else:
            entry["ref_count"] = next_count


@router.post("/start")
@limiter.limit("10/minute")
async def start_debate(request: Request, body: StartDebateRequest) -> Dict:
    figure_info = FIGURES_DATA[body.figure]

    topic_title = None
    for t in figure_info.topics:
        if t.id == body.topic_id:
            topic_title = t.title
            break

    if not topic_title:
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    if os.environ.get("REPL_ID"):
        context = retrieval_service.get_context(body.figure.value, topic_title, "")
    else:
        context = await asyncio.to_thread(
            retrieval_service.get_context, body.figure.value, topic_title, ""
        )
    persona_prompt = get_persona_prompt(body.figure.value, body.topic_id)

    try:
        opening_statement = await grok_service.generate_response(
            system_prompt=persona_prompt,
            context=context.get("formatted", ""),
            topic=topic_title,
            debate_history=[],
            user_argument="Present your opening statement on this topic.",
            figure_name=figure_info.name,
            max_tokens=200,
        )
    except Exception as exc:
        logger.warning("Opening statement generation failed: %s", exc, exc_info=True)
        opening_statement = (
            f"I am ready to debate you on the topic: {topic_title}. Let us begin."
        )

    opening_key_claims = []
    try:
        opening_key_claims = await grok_service.extract_key_claims(
            opening_statement, figure_info.name
        )
    except Exception as exc:
        logger.warning("Opening key-claim extraction failed: %s", exc, exc_info=True)
        pass

    debate_id = str(uuid.uuid4())
    debate = DebateState(
        id=debate_id,
        figure=body.figure,
        topic=topic_title,
        topic_id=body.topic_id,
        mode=body.mode,
        max_turns=body.max_turns,
        current_turn=0,
        turns=[],
        created_at=time.time(),
        status="active",
        opening_statement=opening_statement,
    )

    await debate_persistence.save(debate)

    raw_passages = context.get("passages", [])
    passages = [Passage(**p) for p in raw_passages] if raw_passages else []

    return {
        "debate": debate.model_dump(),
        "opening_statement": opening_statement,
        "opening_key_claims": opening_key_claims,
        "sources": context.get("sources", []),
        "passages": [p.model_dump() for p in passages],
    }


@router.post("/turn")
@limiter.limit("20/minute")
async def submit_turn(request: Request, body: SubmitArgumentRequest) -> Dict:
    lock = await _acquire_debate_lock(body.debate_id)
    try:
        async with lock:
            return await _submit_turn_impl(body)
    finally:
        await _release_debate_lock(body.debate_id)


async def _submit_turn_impl(request: SubmitArgumentRequest) -> Dict:
    debate = await debate_persistence.get(request.debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if debate.status != "active":
        raise HTTPException(status_code=400, detail="Debate is not active")

    if debate.mode == "structured" and debate.current_turn >= debate.max_turns:
        debate.status = "completed"
        await debate_persistence.save(debate)
        raise HTTPException(status_code=400, detail="Debate has reached maximum turns")

    figure_info = FIGURES_DATA[debate.figure]
    persona_prompt = get_persona_prompt(debate.figure.value, getattr(debate, "topic_id", None))

    if os.environ.get("REPL_ID"):
        context = retrieval_service.get_context(
            debate.figure.value, debate.topic, request.argument
        )
    else:
        context = await asyncio.to_thread(
            retrieval_service.get_context,
            debate.figure.value,
            debate.topic,
            request.argument,
        )

    debate_history = []
    for turn in debate.turns:
        debate_history.append({"role": "user", "content": turn.user_argument})
        debate_history.append({"role": "assistant", "content": turn.figure_response})

    generation_failed = False
    try:
        figure_response = await grok_service.generate_response(
            system_prompt=persona_prompt,
            context=context.get("formatted", ""),
            topic=debate.topic,
            debate_history=debate_history,
            user_argument=request.argument,
            figure_name=figure_info.name,
        )
    except Exception as exc:
        logger.warning("Turn response generation failed: %s", exc, exc_info=True)
        generation_failed = True
        figure_response = (
            f"I cannot fully respond right now, but your point on '{debate.topic}' is noted. "
            "Please submit again and I will continue."
        )

    raw_passages = context.get("passages", [])

    key_claims = []
    try:
        key_claims = await grok_service.extract_key_claims(figure_response, figure_info.name)
    except Exception as exc:
        logger.warning("Turn key-claim extraction failed: %s", exc, exc_info=True)
        pass

    previous_figure_response = None
    if debate.current_turn == 0:
        previous_figure_response = getattr(debate, "opening_statement", None) or ""
    elif debate.turns:
        previous_figure_response = debate.turns[-1].figure_response

    if generation_failed:
        score_result = {
            "scores": None,
            "scores_error": "Scoring unavailable — response generation failed",
        }
    else:
        try:
            score_result = await grok_service.score_argument(
                user_argument=request.argument,
                figure_response=figure_response,
                topic=debate.topic,
                sources=context.get("sources", []),
                figure_name=figure_info.name,
                passages=raw_passages,
                previous_figure_response=previous_figure_response or None,
            )
        except Exception as exc:
            logger.warning("Turn scoring failed: %s", exc, exc_info=True)
            score_result = {
                "scores": None,
                "scores_error": "Scoring unavailable — temporary scoring error",
            }
    passages = [Passage(**p) for p in raw_passages] if raw_passages else []

    scores = score_result.get("scores") if "scores_error" in score_result else score_result
    scores_error = score_result.get("scores_error")

    turn = DebateTurn(
        turn_number=debate.current_turn + 1,
        user_argument=request.argument,
        figure_response=figure_response,
        sources_used=context.get("sources", []),
        passages=passages,
        scores=scores,
        scores_error=scores_error,
        key_claims=key_claims,
    )

    debate.turns.append(turn)
    debate.current_turn += 1

    if debate.mode == "structured" and debate.current_turn >= debate.max_turns:
        debate.status = "completed"

    await debate_persistence.save(debate)

    learning_summary = None
    if debate.status == "completed" and debate.turns:
        all_passages = []
        for t in debate.turns:
            if hasattr(t, "passages") and t.passages:
                for p in t.passages:
                    all_passages.append({"title": p.title, "text_excerpt": p.text_excerpt})
        try:
            learning_summary = await grok_service.generate_learning_summary(
                figure_name=figure_info.name,
                topic=debate.topic,
                turns=[t.model_dump() for t in debate.turns],
                passages=all_passages[:6],
            )
        except Exception as exc:
            logger.warning("Learning summary generation failed: %s", exc, exc_info=True)
            learning_summary = {"summary": None, "suggested_readings": []}

    result = {
        "debate": debate.model_dump(),
        "turn": turn.model_dump(),
        "context": context,
    }
    if learning_summary is not None:
        result["learning_summary"] = learning_summary
    return result


@router.get("/{debate_id}")
async def get_debate(debate_id: str) -> DebateState:
    debate = await debate_persistence.get(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate


@router.post("/{debate_id}/end")
async def end_debate(debate_id: str) -> Dict:
    lock = await _acquire_debate_lock(debate_id)
    try:
        async with lock:
            debate = await debate_persistence.get(debate_id)
            if not debate:
                raise HTTPException(status_code=404, detail="Debate not found")
            debate.status = "completed"
            await debate_persistence.save(debate)

        learning_summary = None
        if debate.turns:
            figure_info = FIGURES_DATA[debate.figure]
            all_passages = []
            for t in debate.turns:
                if hasattr(t, "passages") and t.passages:
                    for p in t.passages:
                        all_passages.append(
                            {"title": p.title, "text_excerpt": p.text_excerpt}
                        )
            try:
                learning_summary = await grok_service.generate_learning_summary(
                    figure_name=figure_info.name,
                    topic=debate.topic,
                    turns=[t.model_dump() for t in debate.turns],
                    passages=all_passages[:6],
                )
            except Exception as exc:
                logger.warning("End-debate summary generation failed: %s", exc, exc_info=True)
                learning_summary = {"summary": None, "suggested_readings": []}

        return {
            "debate": debate.model_dump(),
            "learning_summary": learning_summary,
        }
    finally:
        await _release_debate_lock(debate_id)


@router.delete("/{debate_id}")
async def delete_debate(debate_id: str) -> Dict:
    lock = await _acquire_debate_lock(debate_id)
    try:
        async with lock:
            deleted = await debate_persistence.delete(debate_id)
            if deleted:
                return {"success": True}
            raise HTTPException(status_code=404, detail="Debate not found")
    finally:
        await _release_debate_lock(debate_id)
