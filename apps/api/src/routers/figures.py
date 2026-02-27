from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
import asyncio
from typing import Dict
from ..models.figures import FIGURES_DATA, Figure
from ..models.schemas import FigureInfo
from ..services.retrieval_service import retrieval_service
from ..services.grok_service import grok_service

router = APIRouter(prefix="/figures", tags=["figures"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_figures() -> JSONResponse:
    figures = list(FIGURES_DATA.values())
    return JSONResponse(
        content=[f.model_dump() for f in figures],
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    )


@router.get("/{figure_id}")
async def get_figure(figure_id: str) -> JSONResponse:
    try:
        figure = Figure(figure_id)
        data = FIGURES_DATA[figure]
        return JSONResponse(
            content=data.model_dump(),
            headers={
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            },
        )
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found")


@router.get("/{figure_id}/sources")
async def get_figure_sources(figure_id: str) -> JSONResponse:
    """List the loaded full-text sources for a figure (chapters, sections, etc.)."""
    try:
        Figure(figure_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found")

    if os.environ.get("REPL_ID"):
        sources = retrieval_service.list_loaded_sources(figure_id)
    else:
        sources = await asyncio.to_thread(
            retrieval_service.list_loaded_sources, figure_id
        )
    return JSONResponse(
        content={"sources": sources},
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    )


@router.get("/{figure_id}/topics/{topic_id}/preview")
async def get_topic_preview(figure_id: str, topic_id: str) -> Dict:
    """Preview key passages for a topic before starting a debate."""
    try:
        figure = Figure(figure_id)
        info = FIGURES_DATA[figure]
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found")

    topic_title = None
    for t in info.topics:
        if t.id == topic_id:
            topic_title = t.title
            break
    if not topic_title:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")

    if os.environ.get("REPL_ID"):
        context = retrieval_service.get_context(figure_id, topic_title, "")
    else:
        context = await asyncio.to_thread(
            retrieval_service.get_context, figure_id, topic_title, ""
        )
    return {
        "passages": context.get("passages", []),
        "sources": context.get("sources", []),
    }


@router.get("/{figure_id}/topics/{topic_id}/primer")
async def get_topic_primer(figure_id: str, topic_id: str) -> Dict:
    """Position primer before debate: what the figure argues, sample quote, user task."""
    try:
        figure = Figure(figure_id)
        info = FIGURES_DATA[figure]
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found")

    topic_title = None
    for t in info.topics:
        if t.id == topic_id:
            topic_title = t.title
            break
    if not topic_title:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")

    if os.environ.get("REPL_ID"):
        context = retrieval_service.get_context(figure_id, topic_title, "")
    else:
        context = await asyncio.to_thread(
            retrieval_service.get_context, figure_id, topic_title, ""
        )
    passages = context.get("passages", [])
    primer = await grok_service.generate_position_primer(
        info.name, topic_title, passages
    )
    return primer


@router.get("/{figure_id}/topics")
async def get_figure_topics(figure_id: str) -> JSONResponse:
    try:
        figure = Figure(figure_id)
        info = FIGURES_DATA[figure]
        return JSONResponse(
            content=[t.model_dump() for t in info.topics],
            headers={
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            },
        )
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found")
