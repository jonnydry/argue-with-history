#!/usr/bin/env python3
"""Precompute embeddings for all figures. Run from repo root with:

  ./apps/api/venv/bin/python scripts/precompute_embeddings.py

(or activate the api venv first, then: python scripts/precompute_embeddings.py)

Requires OPENAI_API_KEY in apps/api/.env
"""
import json
import os
import sys
from pathlib import Path

# Add api to path
repo = Path(__file__).parent.parent
sys.path.insert(0, str(repo / "apps" / "api"))
os.chdir(repo)

# Load .env from apps/api so OPENAI_API_KEY is available
try:
    from dotenv import load_dotenv
    load_dotenv(repo / "apps" / "api" / ".env")
except ImportError:
    pass

from openai import OpenAI

DATA_ROOT = repo / "data" / "figures"
API_KEY = os.environ.get("OPENAI_API_KEY", "")

if not API_KEY:
    print("Set OPENAI_API_KEY to run precompute.")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)


def get_sections_for_figure(figure: str) -> list[dict]:
    """Yield {id, title, text} for each section of a figure."""
    base = DATA_ROOT / figure
    if not base.exists():
        return []

    sections = []
    if figure == "machiavelli":
        index = json.loads((base / "chapter_index.json").read_text())
        texts = json.loads((base / "the_prince.json").read_text())
        for ch_id, ch_info in index.get("chapters", {}).items():
            ch_text = texts.get("chapters", {}).get(ch_id, {})
            text = ch_text.get("text", "")
            if text:
                sections.append({"id": ch_id, "title": ch_info.get("title", ch_id), "text": text[:2000]})
    elif figure == "socrates":
        index = json.loads((base / "dialogue_index.json").read_text())
        texts = json.loads((base / "dialogues.json").read_text())
        for dial_id, dial_info in index.get("dialogues", {}).items():
            text = texts.get(dial_id, {}).get("text", "")[:2000]
            if text:
                sections.append({"id": dial_id, "title": dial_info.get("title", dial_id), "text": text})
    else:
        idx_path = base / "index.json"
        if not idx_path.exists():
            return []
        index = json.loads(idx_path.read_text())
        secs = index.get("sections") or index.get("chapters") or index.get("books") or index.get("parts") or {}
        for sid, data in secs.items():
            text = data.get("text", "")
            if text:
                title = data.get("section") or data.get("chapter") or data.get("book") or data.get("part") or sid
                sections.append({"id": sid, "title": str(title), "text": text[:2000]})

    return sections


def embed_text(text: str) -> list[float]:
    resp = client.embeddings.create(model="text-embedding-3-small", input=text[:8000])
    return resp.data[0].embedding


def main():
    figures = [d.name for d in DATA_ROOT.iterdir() if d.is_dir()]
    for figure in figures:
        sections = get_sections_for_figure(figure)
        if not sections:
            print(f"  {figure}: no sections, skip")
            continue
        embeddings = {}
        for s in sections:
            vec = embed_text(f"{s['title']}\n\n{s['text']}")
            embeddings[s["id"]] = vec
        out_path = DATA_ROOT / figure / "embeddings.json"
        out_path.write_text(json.dumps(embeddings), encoding="utf-8")
        print(f"  {figure}: {len(embeddings)} embeddings -> {out_path}")
    print("Done.")


if __name__ == "__main__":
    main()
