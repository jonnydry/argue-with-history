#!/usr/bin/env python3
"""
Download public-domain philosophical texts from Project Gutenberg and
build structured index.json files for each new figure.

Run from repo root:
  ./apps/api/venv/bin/python scripts/setup_new_figures.py
"""

import json
import re
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DATA_ROOT = REPO_ROOT / "data" / "figures"

# Project Gutenberg plain-text URLs (UTF-8 variants where available)
SOURCES = {
    "plato": {
        "url": "https://www.gutenberg.org/cache/epub/1497/pg1497.txt",
        "filename": "republic.txt",
    },
    "aristotle": {
        "url": "https://www.gutenberg.org/cache/epub/8438/pg8438.txt",
        "filename": "nicomachean_ethics.txt",
    },
    "hume": {
        "url": "https://www.gutenberg.org/cache/epub/9662/pg9662.txt",
        "filename": "enquiry.txt",
    },
    "kant": {
        "url": "https://www.gutenberg.org/cache/epub/5682/pg5682.txt",
        "filename": "groundwork.txt",
    },
    "wollstonecraft": {
        "url": "https://www.gutenberg.org/cache/epub/3420/pg3420.txt",
        "filename": "vindication.txt",
    },
    "marx": {
        "url": "https://www.gutenberg.org/cache/epub/61/pg61.txt",
        "filename": "manifesto.txt",
    },
    "thoreau": {
        "url": "https://www.gutenberg.org/cache/epub/71/pg71.txt",
        "filename": "civil_disobedience.txt",
    },
    # --- 16 new figures ---
    "seneca": {
        "url": "https://www.gutenberg.org/cache/epub/17742/pg17742.txt",
        "filename": "epistles.txt",
    },
    "cicero": {
        "url": "https://www.gutenberg.org/cache/epub/47100/pg47100.txt",
        "filename": "on_duties.txt",
    },
    "lucretius": {
        "url": "https://www.gutenberg.org/cache/epub/785/pg785.txt",
        "filename": "nature_of_things.txt",
    },
    "descartes": {
        "url": "https://www.gutenberg.org/cache/epub/59/pg59.txt",
        "filename": "meditations.txt",
    },
    "spinoza": {
        "url": "https://www.gutenberg.org/cache/epub/3800/pg3800.txt",
        "filename": "ethics.txt",
    },
    "leibniz": {
        "url": "https://www.gutenberg.org/cache/epub/17147/pg17147.txt",
        "filename": "monadology.txt",
    },
    "voltaire": {
        "url": "https://www.gutenberg.org/cache/epub/19942/pg19942.txt",
        "filename": "candide.txt",
    },
    "paine": {
        "url": "https://www.gutenberg.org/cache/epub/147/pg147.txt",
        "filename": "common_sense.txt",
    },
    "burke": {
        "url": "https://www.gutenberg.org/cache/epub/15679/pg15679.txt",
        "filename": "reflections.txt",
    },
    "douglass": {
        "url": "https://www.gutenberg.org/cache/epub/23/pg23.txt",
        "filename": "narrative.txt",
    },
    "emerson": {
        "url": "https://www.gutenberg.org/cache/epub/16643/pg16643.txt",
        "filename": "essays.txt",
    },
    "dubois": {
        "url": "https://www.gutenberg.org/cache/epub/408/pg408.txt",
        "filename": "souls_of_black_folk.txt",
    },
    "darwin": {
        "url": "https://www.gutenberg.org/cache/epub/1228/pg1228.txt",
        "filename": "origin_of_species.txt",
    },
    "james": {
        "url": "https://www.gutenberg.org/cache/epub/5116/pg5116.txt",
        "filename": "pragmatism.txt",
    },
    "tocqueville": {
        "url": "https://www.gutenberg.org/cache/epub/815/pg815.txt",
        "filename": "democracy_in_america.txt",
    },
    "russell": {
        "url": "https://www.gutenberg.org/cache/epub/5827/pg5827.txt",
        "filename": "problems_of_philosophy.txt",
    },
}


def strip_gutenberg_boilerplate(text: str) -> str:
    """Remove Project Gutenberg header and footer."""
    start_markers = [
        "*** START OF THE PROJECT GUTENBERG",
        "*** START OF THIS PROJECT GUTENBERG",
        "*END THE SMALL PRINT",
        "End of The Small Print",
    ]
    end_markers = [
        "*** END OF THE PROJECT GUTENBERG",
        "*** END OF THIS PROJECT GUTENBERG",
        "End of Project Gutenberg",
        "End of the Project Gutenberg",
    ]
    start_idx = 0
    for marker in start_markers:
        pos = text.find(marker)
        if pos != -1:
            newline = text.find("\n", pos)
            if newline != -1:
                start_idx = newline + 1
            break

    end_idx = len(text)
    for marker in end_markers:
        pos = text.find(marker)
        if pos != -1:
            end_idx = pos
            break

    return text[start_idx:end_idx].strip()


def normalize_lines(text: str) -> str:
    """Strip leading spaces from each line so indented headers become detectable."""
    return "\n".join(line.lstrip() for line in text.splitlines())


def split_into_sections_by_chapter(text: str, max_chars: int = 3000) -> list[dict]:
    """Split text by CHAPTER / BOOK / numbered section markers."""
    patterns = [
        r"(?m)^(CHAPTER [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(Book [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(BOOK [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(SECTION [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(Section [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(PART [IVXLCDM\d]+\.?[^\n]*)",
        r"(?m)^(Part [IVXLCDM\d]+\.?[^\n]*)",
        # Roman numeral section headings on their own line
        r"(?m)^([IVXLCDM]{1,6}\.)\s*$",
        # All-caps short headings (Marx/Thoreau style)
        r"(?m)^([A-Z][A-Z\s]{4,60})\n",
    ]
    # Try each pattern until we get at least 3 splits
    for pat in patterns:
        splits = re.split(pat, text)
        if len(splits) >= 7:  # header + (title, body) * n
            sections = []
            # splits: [preamble, title1, body1, title2, body2, ...]
            i = 1
            while i + 1 < len(splits):
                title = splits[i].strip()
                body = splits[i + 1].strip()
                if body and len(body) > 100:
                    sections.append({"title": title, "text": body[:max_chars]})
                i += 2
            if len(sections) >= 3:
                return sections

    # Fallback: split by blank-line paragraphs into chunks, targeting ~20 sections max
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    total_len = sum(len(p) for p in paragraphs)
    # Target ~15 sections, minimum 1500 chars each
    target = max(1500, total_len // 15)
    sections = []
    chunk: list[str] = []
    chunk_len = 0
    idx = 1
    for para in paragraphs:
        chunk.append(para)
        chunk_len += len(para)
        if chunk_len >= target:
            combined = "\n\n".join(chunk)
            sections.append({"title": f"Section {idx}", "text": combined[:max_chars]})
            idx += 1
            chunk = []
            chunk_len = 0
    if chunk:
        combined = "\n\n".join(chunk)
        sections.append({"title": f"Section {idx}", "text": combined[:max_chars]})
    return sections


def guess_themes(title: str, text: str) -> list[str]:
    keyword_map = {
        "justice": ["justice", "just"],
        "virtue": ["virtue", "virtuous"],
        "happiness": ["happiness", "happy", "flourishing", "eudaimonia"],
        "freedom": ["freedom", "liberty", "free"],
        "reason": ["reason", "rational", "understanding"],
        "morality": ["moral", "ethics", "duty", "ought"],
        "power": ["power", "authority", "sovereign"],
        "knowledge": ["knowledge", "know", "truth", "belief"],
        "society": ["society", "social", "community"],
        "nature": ["nature", "natural"],
        "equality": ["equality", "equal"],
        "God": ["god", "divine", "religion"],
        "death": ["death", "die", "mortality"],
        "education": ["education", "teach", "learn"],
        "property": ["property", "ownership", "labor"],
        "government": ["government", "state", "law"],
        "revolution": ["revolution", "revolt", "overthrow"],
        "class": ["class", "bourgeois", "proletariat", "worker"],
        "individual": ["individual", "self", "personal"],
        "courage": ["courage", "brave", "fear"],
    }
    combined = (title + " " + text[:500]).lower()
    themes = [theme for theme, keywords in keyword_map.items()
              if any(kw in combined for kw in keywords)]
    return themes[:4] if themes else ["philosophy"]


def build_index(sections: list[dict]) -> dict:
    index: dict = {}
    for i, sec in enumerate(sections, start=1):
        key = str(i)
        index[key] = {
            "section": sec["title"],
            "text": sec["text"],
            "themes": guess_themes(sec["title"], sec["text"]),
        }
    return {"sections": index}


def download_and_build(figure_id: str, info: dict) -> None:
    out_dir = DATA_ROOT / figure_id
    out_dir.mkdir(parents=True, exist_ok=True)
    txt_path = out_dir / info["filename"]
    index_path = out_dir / "index.json"

    if index_path.exists():
        print(f"  {figure_id}: index.json already exists, skipping download.")
        return

    print(f"  {figure_id}: downloading from {info['url']} ...")
    try:
        req = urllib.request.Request(
            info["url"],
            headers={"User-Agent": "argue-with-history-setup/1.0"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  {figure_id}: DOWNLOAD FAILED: {e}")
        return

    # Save raw text
    txt_path.write_text(raw, encoding="utf-8")
    print(f"  {figure_id}: saved {len(raw):,} chars to {txt_path.name}")

    # Strip boilerplate and build index
    clean = normalize_lines(strip_gutenberg_boilerplate(raw))
    sections = split_into_sections_by_chapter(clean)
    if not sections:
        print(f"  {figure_id}: WARNING no sections parsed")
        return

    index = build_index(sections)
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  {figure_id}: wrote {len(index['sections'])} sections to index.json")


def main():
    print("Setting up new figures...")
    for figure_id, info in SOURCES.items():
        download_and_build(figure_id, info)
        time.sleep(1)  # polite delay between Gutenberg requests
    print("Done.")


if __name__ == "__main__":
    main()
