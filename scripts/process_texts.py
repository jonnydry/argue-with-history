#!/usr/bin/env python3
"""Process downloaded texts into structured JSON for retrieval."""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "figures"


def clean_text(text):
    """Remove Gutenberg header/footer and normalize text."""
    # Remove header
    start_match = re.search(r"\*\*\* START OF THE PROJECT", text)
    end_match = re.search(r"\*\*\* END OF THE PROJECT", text)

    if start_match:
        text = text[start_match.end() :]
    if end_match:
        text = text[: end_match.start()]

    # Remove excessive whitespace
    text = re.sub(r"\n\s*\n", "\n\n", text)
    return text.strip()


def process_epictetus():
    """Process Enchiridion - 52 short sections."""
    with open(DATA_DIR / "epictetus" / "enchiridion.txt") as f:
        text = clean_text(f.read())

    # Find sections (Roman numerals)
    sections = {}
    pattern = r"\n\s*([IVXLCDM]+)\s*\n(.*?)(?=\n\s*[IVXLCDM]+\s*\n|\Z)"

    matches = re.findall(pattern, text, re.DOTALL)
    for i, (num, content) in enumerate(matches[:52], 1):
        sections[str(i)] = {
            "section": num,
            "text": content.strip()[:1500],
            "themes": extract_themes(content),
        }

    # Topic mapping
    topic_mapping = {
        "control": ["1", "2", "5", "6", "8"],
        "externals": ["1", "2"],
        "desire": ["2", "6"],
        "aversion": ["2", "6"],
        "judgment": ["5", "6", "42"],
        "freedom": ["1", "17"],
        "discipline": ["10", "11", "13"],
        "adversity": ["7", "9", "10"],
        "death": ["21", "22"],
        "acceptance": ["1", "8", "16"],
        "stoic": ["1", "2", "5"],
        "virtue": ["11", "12", "16", "17"],
        "happiness": ["2", "17"],
        "reason": ["5", "30"],
    }

    return {"sections": sections, "topic_mapping": topic_mapping}


def process_mill():
    """Process On Liberty - 5 chapters."""
    with open(DATA_DIR / "mill" / "on_liberty.txt") as f:
        text = clean_text(f.read())

    # Find the actual chapter content - skip table of contents
    # The real chapters start after "ON LIBERTY" heading
    main_text_start = text.find("ON LIBERTY.")
    if main_text_start > 0:
        text = text[main_text_start:]

    chapters = {}
    # Mill uses "CHAPTER I." with title on next line
    pattern = r"CHAPTER\s*([IVX]+)\.\s*\n([A-Z\s]+)\.\s*\n(.*?)(?=CHAPTER\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)

    for i, (num, title, content) in enumerate(matches[:5], 1):
        chapters[str(i)] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
        }

    topic_mapping = {
        "liberty": ["1", "2", "3", "4", "5"],
        "freedom": ["1", "2", "3"],
        "speech": ["2"],
        "opinion": ["2", "3"],
        "individual": ["1", "3", "4"],
        "society": ["1", "3", "4"],
        "tyranny": ["1", "3"],
        "majority": ["3"],
        "harm": ["2", "9"],
        "utility": ["1", "4"],
        "rights": ["1", "4", "5"],
        "conscience": ["2", "4"],
    }

    return {"chapters": chapters, "topic_mapping": topic_mapping}


def process_aurelius():
    """Process Meditations - 12 books."""
    with open(DATA_DIR / "aurelius" / "meditations.txt") as f:
        text = clean_text(f.read())

    # Find "THE FIRST BOOK", "THE SECOND BOOK" etc. in the actual content
    books = {}
    book_titles = [
        "THE FIRST BOOK",
        "THE SECOND BOOK",
        "THE THIRD BOOK",
        "THE FOURTH BOOK",
        "THE FIFTH BOOK",
        "THE SIXTH BOOK",
        "THE SEVENTH BOOK",
        "THE EIGHTH BOOK",
        "THE NINTH BOOK",
        "THE TENTH BOOK",
        "THE ELEVENTH BOOK",
        "THE TWELFTH BOOK",
    ]

    splits = []
    last_pos = 0
    for title in book_titles:
        pos = text.find(title)
        if pos > 0:
            if last_pos > 0:
                splits.append(text[last_pos:pos])
            last_pos = pos + len(title)
    # Add the last segment
    if last_pos > 0:
        splits.append(text[last_pos:])

    for i, content in enumerate(splits[:12], 1):
        books[str(i)] = {
            "book": str(i),
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
        }

    topic_mapping = {
        "death": ["1", "2", "3", "4", "7", "9", "11"],
        "duty": ["2", "3", "4", "5", "6", "7"],
        "adversity": ["1", "2", "3", "4", "5", "6", "7", "8"],
        "self": ["2", "4", "5", "7", "10", "11", "12"],
        "nature": ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        "reason": ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
        "virtue": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
        "acceptance": ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
        "judgment": ["2", "4", "5", "6", "7", "8", "9", "10", "11"],
        "impermanence": ["2", "3", "4", "5", "6", "7", "9", "10", "11"],
        "stoic": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    }

    return {"books": books, "topic_mapping": topic_mapping}


def process_locke():
    """Process Second Treatise - 19 chapters."""
    with open(DATA_DIR / "locke" / "second_treatise.txt") as f:
        text = clean_text(f.read())

    chapters = {}
    # Locke uses "CHAPTER. I." format
    pattern = r"CHAPTER\.?\s*([IVX]+)\.?\s*\n(.*?)(?=CHAPTER\.?\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)

    for i, (num, content) in enumerate(matches[:19], 1):
        chapters[str(i)] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
        }

    topic_mapping = {
        "rights": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        "property": ["5", "6", "7", "8", "9"],
        "government": [
            "1",
            "2",
            "3",
            "4",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
        ],
        "consent": ["4", "6", "7", "8", "9", "11", "15"],
        "revolution": ["1", "2", "3", "19"],
        "law": ["2", "3", "4", "6", "7", "11", "12", "13", "14", "15"],
        "freedom": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "15"],
        "power": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
        ],
        "nature": ["1", "2", "3", "4", "5", "6"],
        "equality": ["1", "2", "3", "4", "5", "6"],
    }

    return {"chapters": chapters, "topic_mapping": topic_mapping}


def process_rousseau():
    """Process Social Contract - 4 books."""
    with open(DATA_DIR / "rousseau" / "social_contract.txt") as f:
        text = clean_text(f.read())

    books = {}
    pattern = r"BOOK\s*([IV]+)\.?\s*\n(.*?)(?=BOOK\s*[IV]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)

    for i, (num, content) in enumerate(matches[:4], 1):
        books[str(i)] = {
            "book": num,
            "text": content.strip()[:3000],
            "themes": extract_themes(content),
        }

    topic_mapping = {
        "freedom": ["1", "2", "3", "4"],
        "chains": ["1"],
        "general_will": ["1", "2", "3", "4"],
        "society": ["1", "2"],
        "nature": ["1", "2"],
        "democracy": ["2", "3", "4"],
        "sovereignty": ["1", "2", "3"],
        "law": ["1", "2", "3", "4"],
        "citizen": ["1", "2", "3", "4"],
        "government": ["2", "3"],
        "inequality": ["1"],
        "contract": ["1", "2"],
        "will": ["1", "2", "3", "4"],
    }

    return {"books": books, "topic_mapping": topic_mapping}


def process_nietzsche():
    """Process Beyond Good & Evil - 9 chapters."""
    with open(DATA_DIR / "nietzsche" / "beyond_good_evil.txt") as f:
        text = clean_text(f.read())

    parts = {}
    # Nietzsche uses "CHAPTER I", "CHAPTER II" etc.
    pattern = r"CHAPTER\s*([IVX]+)\.?\s*\n?(.*?)(?=CHAPTER\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)

    for i, (num, content) in enumerate(matches[:9], 1):
        parts[str(i)] = {
            "part": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
        }

    topic_mapping = {
        "morality": ["1", "2", "3", "4", "5", "6", "7"],
        "truth": ["1", "2"],
        "power": ["1", "2", "3", "4", "5", "6", "7", "9"],
        "master": ["1", "2", "9"],
        "slave": ["1", "2", "9"],
        "will": ["1", "2", "7"],
        "meaning": ["1", "2", "3", "4", "5"],
        "values": ["1", "2", "5", "6", "9"],
        "religion": ["1", "2", "3"],
        "knowledge": ["1", "2"],
        "life": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        "affirmation": ["2", "11"],
    }

    return {"parts": parts, "topic_mapping": topic_mapping}


def process_hobbes():
    """Process Leviathan - 4 parts with chapters."""
    with open(DATA_DIR / "hobbes" / "leviathan.txt") as f:
        text = clean_text(f.read())

    # Leviathan is complex - let's extract sections by part
    chapters = {}

    # Part I: Of Man
    part1 = re.search(
        r"PART I.*?OF MAN(.*?)(?=PART II|$)", text, re.DOTALL | re.IGNORECASE
    )
    # Part II: Of Commonwealth
    part2 = re.search(
        r"PART II.*?OF COMMONWEALTH(.*?)(?=PART III|$)", text, re.DOTALL | re.IGNORECASE
    )
    # Part III: Of a Christian Commonwealth
    part3 = re.search(
        r"PART III.*?OF A CHRISTIAN COMMONWEALTH(.*?)(?=PART IV|$)",
        text,
        re.DOTALL | re.IGNORECASE,
    )
    # Part IV: Of the Kingdom of Darkness
    part4 = re.search(
        r"PART IV.*?OF THE KINGDOM OF DARKNESS(.*?)$", text, re.DOTALL | re.IGNORECASE
    )

    # Simplified: just map keywords to parts
    parts = {
        "1": {
            "text": part1.group(1)[:3000] if part1 else "",
            "themes": ["man", "nature", "reason", "passions"],
        },
        "2": {
            "text": part2.group(1)[:3000] if part2 else "",
            "themes": ["commonwealth", "sovereign", "laws"],
        },
        "3": {
            "text": part3.group(1)[:3000] if part3 else "",
            "themes": ["christian", "religion", "church"],
        },
        "4": {
            "text": part4.group(1)[:3000] if part4 else "",
            "themes": ["darkness", "superstition"],
        },
    }

    topic_mapping = {
        "power": ["1", "2", "3", "4"],
        "sovereign": ["2", "3", "4"],
        "authority": ["2", "3"],
        "fear": ["1", "2", "13", "17"],
        "nature": ["1", "2", "13"],
        "war": ["1", "2", "13"],
        "freedom": ["1", "2", "17", "18", "20", "21"],
        "law": ["2", "3", "4"],
        "rights": ["1", "2"],
        "contract": ["2", "13", "14", "15", "17"],
        "commonwealth": ["2", "13", "14", "15", "16", "17", "18"],
        "government": ["2", "13", "14", "15", "16", "17", "18", "19", "20", "21"],
        "church": ["3", "4"],
        "religion": ["3", "4"],
    }

    return {"parts": parts, "topic_mapping": topic_mapping}


def extract_themes(text):
    """Simple keyword-based theme extraction."""
    text_lower = text.lower()
    themes = []

    keywords = {
        "death": ["death", "die", "dying", "mortality"],
        "freedom": ["freedom", "free", "liberty"],
        "power": ["power", "strength", "force"],
        "virtue": ["virtue", "goodness", "moral"],
        "truth": ["truth", "truths", "real"],
        "reason": ["reason", "rational", "logic"],
        "nature": ["nature", "natural"],
        "law": ["law", "laws", "legal"],
        "society": ["society", "social", "community"],
        "happiness": ["happiness", "happy", "pleasure"],
    }

    for theme, words in keywords.items():
        if any(w in text_lower for w in words):
            themes.append(theme)

    return themes[:3]


def main():
    figures = {
        "epictetus": process_epictetus,
        "mill": process_mill,
        "aurelius": process_aurelius,
        "locke": process_locke,
        "rousseau": process_rousseau,
        "nietzsche": process_nietzsche,
        "hobbes": process_hobbes,
    }

    for name, process_fn in figures.items():
        print(f"Processing {name}...")
        result = process_fn()

        # Save index
        index_file = DATA_DIR / name / "index.json"
        with open(index_file, "w") as f:
            json.dump(result, f, indent=2)

        print(f"  Saved to {index_file}")

    print("Done!")


if __name__ == "__main__":
    main()
