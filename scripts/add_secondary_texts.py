#!/usr/bin/env python3
"""Add secondary source texts to figures that have only one work.
Merges into existing index.json. Run after downloading texts if needed.
Usage: ./apps/api/venv/bin/python scripts/add_secondary_texts.py
"""
import json
import re
import subprocess
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "figures"

# Gutenberg eBook IDs for secondary works
GUTENBERG = {
    "aristotle": (6762, "Politics", "politics.txt"),
    "plato": (1600, "Symposium", "symposium.txt"),
    "kant": (4280, "Critique of Pure Reason", "critique_pure_reason.txt"),
    "hume": (9662, "Dialogues Concerning Natural Religion", "dialogues_natural_religion.txt"),
    "wollstonecraft": (3420, "Maria", "maria.txt"),
    "marx": (1344, "A Contribution to the Critique of Political Economy", "critique_political_economy.txt"),
    "paine": (147, "The Rights of Man", "rights_of_man.txt"),
    "burke": (15142, "Speech on Conciliation with America", "conciliation.txt"),
    "douglass": (23, "My Bondage and My Freedom", "bondage_freedom.txt"),
    "emerson": (16643, "Representative Men", "representative_men.txt"),
    "darwin": (1228, "The Voyage of the Beagle", "voyage_beagle.txt"),
    "james": (5116, "The Will to Believe", "will_to_believe.txt"),
    "tocqueville": (815, "The Old Regime and the Revolution", "old_regime.txt"),
    "voltaire": (19942, "Treatise on Toleration", "toleration.txt"),
    "russell": (2529, "Political Ideals", "political_ideals.txt"),
    "spinoza": (3800, "Theologico-Political Treatise", "theologico_political.txt"),
    "descartes": (59, "Discourse on the Method", "discourse_method.txt"),
    "leibniz": (17147, "New Essays on Human Understanding", "new_essays.txt"),
    "cicero": (28020, "On the Nature of the Gods", "nature_of_gods.txt"),
    "seneca": (15881, "Letters from a Stoic", "letters_stoic.txt"),
    "dubois": (457, "The Suppression of the African Slave-Trade", "suppression_slave_trade.txt"),
}

# Figures already in process_texts with 2 works - skip
PROCESS_TEXT_FIGURES = {"epictetus", "mill", "aurelius", "locke", "rousseau", "nietzsche", "hobbes", "thoreau"}


def clean_text(text):
    start_match = re.search(r"\*\*\* START OF THE PROJECT", text)
    end_match = re.search(r"\*\*\* END OF THE PROJECT", text)
    if start_match:
        text = text[start_match.end() :]
    if end_match:
        text = text[: end_match.start()]
    text = re.sub(r"\n\s*\n", "\n\n", text)
    return text.strip()


def extract_themes(text):
    text_lower = text.lower()
    keywords = {
        "freedom": ["freedom", "free", "liberty"],
        "power": ["power", "strength", "force"],
        "virtue": ["virtue", "goodness", "moral"],
        "reason": ["reason", "rational", "logic"],
        "nature": ["nature", "natural"],
        "law": ["law", "laws", "legal"],
        "society": ["society", "social", "community"],
    }
    themes = [k for k, words in keywords.items() if any(w in text_lower for w in words)]
    return themes[:3]


def download_gutenberg(ebook_id: int, out_path: Path) -> bool:
    """Download text from Gutenberg cache."""
    url = f"https://www.gutenberg.org/cache/epub/{ebook_id}/pg{ebook_id}.txt"
    try:
        result = subprocess.run(
            ["curl", "-sL", url, "-o", str(out_path)],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return result.returncode == 0 and out_path.exists() and out_path.stat().st_size > 1000
    except Exception:
        return False


def parse_by_books(text: str, work_name: str, max_books: int = 8) -> dict:
    """Split by BOOK I, BOOK II, etc."""
    sections = {}
    book_titles = [f"BOOK {r}" for r in ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]]
    last_pos = 0
    for i, title in enumerate(book_titles[:max_books]):
        pos = text.find(title)
        if pos >= 0:
            if last_pos > 0:
                content = text[last_pos:pos].strip()[:2500]
                if len(content) > 200:
                    sections[str(len(sections) + 1)] = {
                        "section": book_titles[i - 1] if i > 0 else "Intro",
                        "text": content,
                        "themes": extract_themes(content),
                        "work": work_name,
                    }
            last_pos = pos + len(title)
    if last_pos > 0:
        content = text[last_pos:].strip()[:2500]
        if len(content) > 200:
            sections[str(len(sections) + 1)] = {
                "section": book_titles[-1] if book_titles else "End",
                "text": content,
                "themes": extract_themes(content),
                "work": work_name,
            }
    return sections


def parse_by_chapters(text: str, work_name: str, pattern: str, max_ch: int = 10) -> dict:
    """Split by CHAPTER pattern."""
    sections = {}
    matches = list(re.finditer(pattern, text, re.DOTALL | re.IGNORECASE))
    for i, m in enumerate(matches[:max_ch]):
        content = m.group(2).strip()[:2500] if m.lastindex >= 2 else text[m.end() : m.end() + 2500]
        if len(content) > 150:
            num = m.group(1) if m.lastindex >= 1 else str(i + 1)
            sections[str(i + 1)] = {
                "section": num,
                "text": content[:2500],
                "themes": extract_themes(content),
                "work": work_name,
            }
    return sections


def parse_politics(text: str) -> dict:
    return parse_by_books(text, "Politics", max_books=8)


def parse_symposium(text: str) -> dict:
    # Symposium has sections - use paragraph grouping
    sections = {}
    parts = re.split(r"\n\n+", text)
    chunk = []
    chunk_len = 0
    for i, p in enumerate(parts):
        if len(p) > 100:
            chunk.append(p)
            chunk_len += len(p)
            if chunk_len >= 1200:
                content = "\n\n".join(chunk)[:2500]
                sections[str(len(sections) + 1)] = {
                    "section": f"Part {len(sections) + 1}",
                    "text": content,
                    "themes": extract_themes(content),
                    "work": "Symposium",
                }
                chunk = []
                chunk_len = 0
    if chunk and len(chunk) > 0:
        content = "\n\n".join(chunk)[:2500]
        if len(content) > 200:
            sections[str(len(sections) + 1)] = {
                "section": f"Part {len(sections) + 1}",
                "text": content,
                "themes": extract_themes(content),
                "work": "Symposium",
            }
    return dict(list(sections.items())[:8])


def parse_critique_pure_reason(text: str) -> dict:
    return parse_by_books(text, "Critique of Pure Reason", max_books=6)


def parse_generic_books(text: str, work_name: str) -> dict:
    return parse_by_books(text, work_name, max_books=10)


def parse_generic_chapters(text: str, work_name: str) -> dict:
    return parse_by_chapters(
        text,
        work_name,
        r"CHAPTER\s+([IVX\d]+)\.?\s*(.*?)(?=CHAPTER\s+[IVX\d]+|$)",
        max_ch=8,
    )


def parse_by_parts(text: str, work_name: str, max_parts: int = 6) -> dict:
    """Split by PART I, PART II, etc. Use split to avoid ToC matching."""
    sections = {}
    romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    parts = re.split(r"\nPART\s+([IVX]+)\s*\n", text, flags=re.IGNORECASE)
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break
        num_rom = parts[i]
        content = parts[i + 1].strip()[:2500]
        if len(content) > 200:
            idx = (i // 2) + 1
            if idx > max_parts:
                break
            sections[str(idx)] = {
                "section": f"PART {num_rom}",
                "text": content,
                "themes": extract_themes(content),
                "work": work_name,
            }
    return sections


def parse_by_paragraphs(text: str, work_name: str, num_sections: int = 6, min_len: int = 800) -> dict:
    """Split text into roughly equal sections by paragraph groups."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 100]
    if not paragraphs:
        return {}
    total = sum(len(p) for p in paragraphs)
    target = total // num_sections
    sections = {}
    current, current_len, idx = [], 0, 1
    for p in paragraphs:
        current.append(p)
        current_len += len(p)
        if current_len >= target and len(current) > 0:
            content = "\n\n".join(current)[:2500]
            if len(content) > min_len:
                sections[str(idx)] = {
                    "section": f"Part {idx}",
                    "text": content,
                    "themes": extract_themes(content),
                    "work": work_name,
                }
                idx += 1
            current, current_len = [], 0
            if idx > num_sections:
                break
    if current and idx <= num_sections:
        content = "\n\n".join(current)[:2500]
        if len(content) > min_len:
            sections[str(idx)] = {"section": f"Part {idx}", "text": content, "themes": extract_themes(content), "work": work_name}
    return sections


# Parser selection per figure
PARSERS = {
    "aristotle": parse_politics,
    "plato": parse_symposium,
    "kant": parse_critique_pure_reason,
    "hume": lambda t: parse_by_paragraphs(t, "Dialogues Concerning Natural Religion", 6),
    "wollstonecraft": lambda t: parse_by_paragraphs(t, "Maria", 6),
    "marx": lambda t: parse_generic_chapters(t, "Critique of Political Economy"),
    "paine": lambda t: parse_by_paragraphs(t, "Rights of Man", 6),
    "burke": lambda t: parse_by_paragraphs(t, "Speech on Conciliation", 4),
    "douglass": lambda t: parse_by_paragraphs(t, "My Bondage and My Freedom", 6),
    "emerson": lambda t: parse_generic_chapters(t, "Representative Men"),
    "darwin": lambda t: parse_generic_chapters(t, "Voyage of the Beagle"),
    "james": lambda t: parse_generic_chapters(t, "The Will to Believe"),
    "tocqueville": lambda t: parse_by_paragraphs(t, "The Old Regime", 6),
    "voltaire": lambda t: parse_generic_chapters(t, "Treatise on Toleration"),
    "russell": lambda t: parse_generic_chapters(t, "Political Ideals"),
    "spinoza": lambda t: parse_by_paragraphs(t, "Theologico-Political Treatise", 6),
    "descartes": lambda t: parse_by_parts(t, "Discourse on the Method", 6),
    "leibniz": lambda t: parse_by_paragraphs(t, "New Essays on Human Understanding", 6),
    "cicero": lambda t: parse_by_paragraphs(t, "On the Nature of the Gods", 6),
    "seneca": lambda t: parse_by_paragraphs(t, "Letters from a Stoic", 6),
    "dubois": lambda t: parse_by_paragraphs(t, "Suppression of the African Slave-Trade", 6),
}


def add_work_to_sections(sections_dict: dict, work_name: str) -> None:
    """Add work field to sections that don't have it (for primary work display)."""
    for sid, data in sections_dict.items():
        if "work" not in data:
            data["work"] = work_name


def main():
    PRIMARIES = {
        "aristotle": "Nicomachean Ethics",
        "plato": "Republic",
        "kant": "Groundwork",
        "hume": "Enquiry",
        "wollstonecraft": "Vindication",
        "marx": "Communist Manifesto",
        "paine": "Common Sense",
        "burke": "Reflections",
        "douglass": "Narrative",
        "emerson": "Essays",
        "darwin": "Origin of Species",
        "james": "Pragmatism",
        "tocqueville": "Democracy in America",
        "voltaire": "Candide",
        "russell": "Problems of Philosophy",
        "spinoza": "Ethics",
        "descartes": "Meditations",
        "leibniz": "Monadology",
        "cicero": "On Duties",
        "seneca": "Epistles",
        "dubois": "Souls of Black Folk",
    }
    for figure in sorted(GUTENBERG.keys()):
        if figure in PROCESS_TEXT_FIGURES:
            print(f"  {figure}: skip (in process_texts)")
            continue
        base = DATA_DIR / figure
        idx_path = base / "index.json"
        if not idx_path.exists():
            print(f"  {figure}: no index.json")
            continue
        gid, work_name, filename = GUTENBERG[figure]
        txt_path = base / filename
        if not txt_path.exists():
            print(f"  {figure}: downloading {work_name} (gutenberg {gid})...")
            if not download_gutenberg(gid, txt_path):
                print(f"  {figure}: download failed")
                continue
        with open(txt_path) as f:
            text = clean_text(f.read())
        parser = PARSERS.get(figure, lambda t: parse_generic_chapters(t, work_name))
        new_sections = parser(text)
        if not new_sections:
            print(f"  {figure}: no sections parsed")
            continue
        prefix = filename.replace(".txt", "").replace(" ", "_")[:15]
        with open(idx_path) as f:
            index = json.load(f)
        sec_key = "sections" if "sections" in index else "chapters" if "chapters" in index else "books" if "books" in index else "parts"
        secs = index.get(sec_key) or {}
        if any(str(k).startswith(prefix + "_") for k in secs):
            print(f"  {figure}: already has {work_name}, skip")
            continue
        add_work_to_sections(secs, PRIMARIES.get(figure, "Primary"))
        for sid, data in new_sections.items():
            new_id = f"{prefix}_{sid}"
            secs[new_id] = {**data, "work": work_name}
        index[sec_key] = secs
        topic_mapping = index.get("topic_mapping", {})
        for kw in ["freedom", "power", "nature", "reason", "law", "society"]:
            topic_mapping[kw] = list(set(topic_mapping.get(kw, [])) | {f"{prefix}_{s}" for s in new_sections})
        index["topic_mapping"] = topic_mapping
        with open(idx_path, "w") as f:
            json.dump(index, f, indent=2)
        print(f"  {figure}: +{len(new_sections)} sections from {work_name}")
    print("Done.")


if __name__ == "__main__":
    main()
