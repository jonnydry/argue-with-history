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


def _process_discourses():
    """Process Discourses - selection from Epictetus Discourses (before Encheiridion)."""
    path = DATA_DIR / "epictetus" / "discourses.txt"
    if not path.exists():
        return {"sections": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    # Stop at Encheiridion (use rfind - it appears in ToC and again at actual section)
    enchiridion_start = text.rfind("THE ENCHEIRIDION, OR MANUAL.")
    if enchiridion_start > 0:
        text = text[:enchiridion_start]
    # Split on discourse titles: newline + ALL CAPS line ending with .— or .-
    # Use explicit em-dash (U+2014) - raw \u escapes can fail in some envs
    emdash = "\u2014"
    parts = re.split(
        rf"\n([A-Z][A-Z \.,\'\-]{{25,}}\.[{emdash}\u2013\-])\s*",
        text,
    )
    sections = {}
    for i in range(2, len(parts), 2):  # Even indices 2,4,6... are content (parts[1]=title1, parts[2]=content1)
        if i >= len(parts):
            break
        title = parts[i - 1]
        content = parts[i].strip()[:2000]
        # Skip if title looks like header (e.g. "A SELECTION FROM...")
        if "SELECTION" in title or "DISCOURSES OF EPICTETUS" in title:
            continue
        if len(content) > 150:
            idx = str(len(sections) + 1)
            sections[idx] = {
                "section": title.replace(".—", "").replace(".−", "").strip()[:60],
                "text": content,
                "themes": extract_themes(content),
                "work": "Discourses",
            }
            if len(sections) >= 20:
                break
    topic_mapping = {
        "control": list(sections.keys()),
        "virtue": list(sections.keys()),
        "reason": list(sections.keys()),
    }
    return {"sections": sections, "topic_mapping": topic_mapping}


def process_epictetus():
    """Process Enchiridion + Discourses - merged index."""
    with open(DATA_DIR / "epictetus" / "enchiridion.txt") as f:
        text = clean_text(f.read())
    sections = {}
    pattern = r"\n\s*([IVXLCDM]+)\s*\n(.*?)(?=\n\s*[IVXLCDM]+\s*\n|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)
    for i, (num, content) in enumerate(matches[:52], 1):
        sections[str(i)] = {
            "section": num,
            "text": content.strip()[:1500],
            "themes": extract_themes(content),
            "work": "Enchiridion",
        }
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
    discourses = _process_discourses()
    disc_prefixed = _prefix_sections(discourses["sections"], "discourses", "Discourses")
    sections = {**sections, **disc_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, discourses["topic_mapping"], "discourses")
    return {"sections": sections, "topic_mapping": topic_mapping}


def _process_on_liberty():
    """Process On Liberty - 5 chapters."""
    with open(DATA_DIR / "mill" / "on_liberty.txt") as f:
        text = clean_text(f.read())
    main_text_start = text.find("ON LIBERTY.")
    if main_text_start > 0:
        text = text[main_text_start:]
    chapters = {}
    pattern = r"CHAPTER\s*([IVX]+)\.\s*\n([A-Z\s]+)\.\s*\n(.*?)(?=CHAPTER\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    for i, (num, title, content) in enumerate(matches[:5], 1):
        chapters[str(i)] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "On Liberty",
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


def _process_utilitarianism():
    """Process Utilitarianism - 5 chapters."""
    path = DATA_DIR / "mill" / "utilitarianism.txt"
    if not path.exists():
        return {"chapters": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    main_text_start = text.find("UTILITARIANISM.")
    if main_text_start > 0:
        text = text[main_text_start:]
    chapters = {}
    pattern = r"CHAPTER\s*([IVX]+)\.\s*\n([A-Z\s\.]+)\s*\n(.*?)(?=CHAPTER\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    for i, (num, title, content) in enumerate(matches[:5], 1):
        chapters[str(i)] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Utilitarianism",
        }
    topic_mapping = {
        "utility": ["1", "2", "3", "4", "5"],
        "happiness": ["1", "2", "3", "4"],
        "morality": ["1", "2", "3", "4", "5"],
        "justice": ["5"],
        "pleasure": ["2"],
        "right": ["1", "2", "3", "4", "5"],
    }
    return {"chapters": chapters, "topic_mapping": topic_mapping}


def process_mill():
    """Process On Liberty + Utilitarianism - merged index."""
    ol = _process_on_liberty()
    util = _process_utilitarianism()
    util_prefixed = _prefix_sections(util["chapters"], "utilitarianism", "Utilitarianism")
    chapters = {**ol["chapters"], **util_prefixed}
    topic_mapping = _merge_topic_mappings(ol["topic_mapping"], util["topic_mapping"], "utilitarianism")
    return {"chapters": chapters, "topic_mapping": topic_mapping}


def _process_meditations_chrystal():
    """Process Meditations (Chrystal/Foulis translation) - 12 books. Gutenberg 55317."""
    path = DATA_DIR / "aurelius" / "meditations_chrystal.txt"
    if not path.exists():
        return {"books": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    books = {}
    book_titles = [f"BOOK {r}." for r in ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]]
    splits = []
    last_pos = 0
    for title in book_titles:
        pos = text.find(title)
        if pos > 0:
            if last_pos > 0:
                splits.append(text[last_pos:pos])
            last_pos = pos + len(title)
    if last_pos > 0:
        splits.append(text[last_pos:])
    for i, content in enumerate(splits[:12], 1):
        books[str(i)] = {
            "book": str(i),
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Meditations (Chrystal Translation)",
        }
    topic_mapping = {k: list(books.keys()) for k in ["virtue", "reason", "stoic", "nature"]}
    return {"books": books, "topic_mapping": topic_mapping}


def process_aurelius():
    """Process Meditations + Meditations (Chrystal) - merged index."""
    with open(DATA_DIR / "aurelius" / "meditations.txt") as f:
        text = clean_text(f.read())
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
    if last_pos > 0:
        splits.append(text[last_pos:])
    for i, content in enumerate(splits[:12], 1):
        books[str(i)] = {
            "book": str(i),
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Meditations",
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
    chrystal = _process_meditations_chrystal()
    chrystal_prefixed = _prefix_sections(chrystal["books"], "chrystal", "Meditations (Chrystal Translation)")
    books = {**books, **chrystal_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, chrystal["topic_mapping"], "chrystal")
    return {"books": books, "topic_mapping": topic_mapping}


def _process_essay_human_understanding():
    """Process Essay Concerning Human Understanding - excerpt (Book II Ch. XXI-XXIII: Power, Mixed Modes, Substances)."""
    path = DATA_DIR / "locke" / "essay_human_understanding.txt"
    if not path.exists():
        return {"chapters": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    chapters = {}
    # Match CHAPTER XXI. / CHAPTER XXII. / CHAPTER XXIII.
    pattern = r"CHAPTER\s+(XXI|XXII|XXIII)\.\s*(.*?)(?=CHAPTER\s+(?:XXI|XXII|XXIII|XXIV|XXX)\.|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    for num, content in matches:
        num_upper = num.upper()
        chapters[num_upper] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Essay Concerning Human Understanding",
        }
    topic_mapping = {
        "freedom": ["XXI"],
        "power": ["XXI", "XXII"],
        "will": ["XXI"],
        "idea": ["XXII", "XXIII"],
        "substance": ["XXIII"],
    }
    return {"chapters": chapters, "topic_mapping": topic_mapping}


def process_locke():
    """Process Second Treatise + Essay excerpt - merged index."""
    with open(DATA_DIR / "locke" / "second_treatise.txt") as f:
        text = clean_text(f.read())
    chapters = {}
    pattern = r"CHAPTER\.?\s*([IVX]+)\.?\s*\n(.*?)(?=CHAPTER\.?\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    for i, (num, content) in enumerate(matches[:19], 1):
        chapters[str(i)] = {
            "chapter": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Second Treatise of Government",
        }
    topic_mapping = {
        "rights": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        "property": ["5", "6", "7", "8", "9"],
        "government": ["1", "2", "3", "4", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
        "consent": ["4", "6", "7", "8", "9", "11", "15"],
        "revolution": ["1", "2", "3", "19"],
        "law": ["2", "3", "4", "6", "7", "11", "12", "13", "14", "15"],
        "freedom": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "15"],
        "power": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
        "nature": ["1", "2", "3", "4", "5", "6"],
        "equality": ["1", "2", "3", "4", "5", "6"],
    }
    essay = _process_essay_human_understanding()
    essay_prefixed = _prefix_sections(essay["chapters"], "essay", "Essay Concerning Human Understanding")
    chapters = {**chapters, **essay_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, essay["topic_mapping"], "essay")
    return {"chapters": chapters, "topic_mapping": topic_mapping}


def _process_discourse_inequality():
    """Process Discourse on the Origin of Inequality - 2 parts."""
    path = DATA_DIR / "rousseau" / "discourse_inequality.txt"
    if not path.exists():
        return {"parts": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    # Split on "DISCOURSE FIRST PART" and "SECOND PART"
    part1_start = text.find("DISCOURSE FIRST PART")
    part2_start = text.find("SECOND PART")
    if part1_start < 0 or part2_start < 0:
        return {"parts": {}, "topic_mapping": {}}
    part1 = text[part1_start + len("DISCOURSE FIRST PART") : part2_start].strip()
    part2 = text[part2_start + len("SECOND PART") :].strip()
    # Trim Gutenberg footer from part2 if present
    if "*** END OF THE PROJECT" in part2:
        part2 = part2[: part2.find("*** END OF THE PROJECT")].strip()
    parts = {
        "1": {
            "part": "1",
            "text": part1[:3000],
            "themes": extract_themes(part1),
            "work": "Discourse on the Origin of Inequality",
        },
        "2": {
            "part": "2",
            "text": part2[:3000],
            "themes": extract_themes(part2),
            "work": "Discourse on the Origin of Inequality",
        },
    }
    topic_mapping = {
        "nature": ["1", "2"],
        "inequality": ["1", "2"],
        "society": ["1", "2"],
        "freedom": ["1", "2"],
        "property": ["2"],
    }
    return {"parts": parts, "topic_mapping": topic_mapping}


def process_rousseau():
    """Process Social Contract + Discourse on Inequality - merged index."""
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
            "work": "Social Contract",
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
    inequality = _process_discourse_inequality()
    ineq_prefixed = _prefix_sections(inequality["parts"], "inequality", "Discourse on the Origin of Inequality")
    books = {**books, **ineq_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, inequality["topic_mapping"], "inequality")
    return {"books": books, "topic_mapping": topic_mapping}


def _process_genealogy_morals():
    """Process Genealogy of Morals - 3 essays."""
    path = DATA_DIR / "nietzsche" / "genealogy_morals.txt"
    if not path.exists():
        return {"parts": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    parts = {}
    # First essay starts after "FIRST ESSAY. "GOOD AND EVIL," "GOOD AND BAD"."
    essay_pattern = r"(?:FIRST|SECOND|THIRD)\s+ESSAY\.\s*[^\n]+\.?\s*\n(.*?)(?=(?:FIRST|SECOND|THIRD)\s+ESSAY\.|$)"
    matches = re.findall(essay_pattern, text, re.DOTALL | re.IGNORECASE)
    titles = ["Good and Evil, Good and Bad", "Guilt, Bad Conscience", "Ascetic Ideals"]
    for i, content in enumerate(matches[:3], 1):
        parts[str(i)] = {
            "part": str(i),
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Genealogy of Morals",
        }
    topic_mapping = {
        "morality": ["1", "2", "3"],
        "guilt": ["2"],
        "conscience": ["2", "3"],
        "ascetic": ["3"],
        "master": ["1"],
        "slave": ["1"],
        "values": ["1", "2", "3"],
        "religion": ["3"],
    }
    return {"parts": parts, "topic_mapping": topic_mapping}


def process_nietzsche():
    """Process Beyond Good & Evil + Genealogy of Morals - merged index."""
    with open(DATA_DIR / "nietzsche" / "beyond_good_evil.txt") as f:
        text = clean_text(f.read())
    parts = {}
    pattern = r"CHAPTER\s*([IVX]+)\.?\s*\n?(.*?)(?=CHAPTER\s*[IVX]+|$)"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    for i, (num, content) in enumerate(matches[:9], 1):
        parts[str(i)] = {
            "part": num,
            "text": content.strip()[:2500],
            "themes": extract_themes(content),
            "work": "Beyond Good and Evil",
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
    genealogy = _process_genealogy_morals()
    gen_prefixed = _prefix_sections(genealogy["parts"], "genealogy", "Genealogy of Morals")
    parts = {**parts, **gen_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, genealogy["topic_mapping"], "genealogy")
    return {"parts": parts, "topic_mapping": topic_mapping}


def _process_civil_disobedience():
    """Process Civil Disobedience - split into ~7 sections by paragraphs."""
    with open(DATA_DIR / "thoreau" / "civil_disobedience.txt") as f:
        text = clean_text(f.read())
    paragraphs = re.split(r"\n\s*\n", text)
    # Group paragraphs into ~7 sections of ~1500-2000 chars
    sections = {}
    current = []
    current_len = 0
    section_num = 1
    target = 1500
    for p in paragraphs:
        p = p.strip()
        if not p or len(p) < 20:
            continue
        current.append(p)
        current_len += len(p)
        if current_len >= target and section_num <= 7:
            combined = "\n\n".join(current)
            sections[str(section_num)] = {
                "section": f"Section {section_num}",
                "text": combined[:2000],
                "themes": extract_themes(combined),
                "work": "Civil Disobedience",
            }
            section_num += 1
            current = []
            current_len = 0
    if current and section_num <= 7:
        combined = "\n\n".join(current)
        sections[str(section_num)] = {
            "section": f"Section {section_num}",
            "text": combined[:2000],
            "themes": extract_themes(combined),
            "work": "Civil Disobedience",
        }
    topic_mapping = {
        "government": ["1", "2", "3", "4", "5", "6", "7"],
        "conscience": ["1", "2", "3", "4", "5", "6"],
        "law": ["1", "2", "3", "4", "5"],
        "freedom": ["1", "2", "3", "4", "5"],
        "morality": ["1", "2", "3", "4", "5", "6"],
    }
    return {"sections": sections, "topic_mapping": topic_mapping}


def _process_walden():
    """Process Walden - extract chapters (Economy, Where I Lived, Reading, Sounds, etc.)."""
    path = DATA_DIR / "thoreau" / "walden.txt"
    if not path.exists():
        return {"sections": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    # "ON THE DUTY" appears in TOC; the actual Civil Disobedience starts much later (after Walden)
    walden_end = text.find("ON THE DUTY OF CIVIL DISOBEDIENCE", 100_000)
    if walden_end > 0:
        text = text[:walden_end]
    # Skip table of contents - find "Economy" followed by "When I wrote" (actual chapter start)
    economy_marker = "Economy\n\nWhen I wrote"
    main_start = text.find(economy_marker)
    if main_start >= 0:
        text = text[main_start:]
    chapter_titles = [
        "Economy", "Where I Lived, and What I Lived For", "Reading", "Sounds",
        "Solitude", "Visitors", "The Bean-Field", "The Village",
    ]
    sections = {}
    for i, title in enumerate(chapter_titles, 1):
        start = text.find("\n" + title + "\n")
        if start < 0:
            start = text.find(title + "\n")
        if start < 0:
            continue
        start += len(title) + 1  # Include newline
        next_start = len(text)
        for other in chapter_titles:
            if other == title:
                continue
            pos = text.find("\n" + other + "\n", start)
            if pos < 0:
                pos = text.find(other + "\n", start)
            if 0 <= pos < next_start:
                next_start = pos
        content = text[start:next_start].strip()[:2000]
        if len(content) > 100:
            sections[str(i)] = {
                "section": title,
                "text": content,
                "themes": extract_themes(content),
                "work": "Walden",
            }
    topic_mapping = {
        "nature": list(sections.keys()),
        "simplicity": ["1", "2"],
        "solitude": ["5"],
        "freedom": ["1", "2"],
    }
    return {"sections": sections, "topic_mapping": topic_mapping}


def process_thoreau():
    """Process Civil Disobedience + Walden - merged index."""
    cd = _process_civil_disobedience()
    walden = _process_walden()
    walden_prefixed = _prefix_sections(walden["sections"], "walden", "Walden")
    sections = {**cd["sections"], **walden_prefixed}
    topic_mapping = _merge_topic_mappings(cd["topic_mapping"], walden["topic_mapping"], "walden")
    return {"sections": sections, "topic_mapping": topic_mapping}


def _process_de_cive():
    """Process De Cive (Philosophical Rudiments) - excerpt. Gutenberg 73906."""
    path = DATA_DIR / "hobbes" / "de_cive.txt"
    if not path.exists():
        return {"chapters": {}, "topic_mapping": {}}
    with open(path) as f:
        text = clean_text(f.read())
    # Skip index - main text starts around CHAPTER I.
    chapter_pattern = r"CHAPTER\s+([IVX]+)\.?\s*(.*?)(?=CHAPTER\s+[IVX]+|$)"
    matches = re.findall(chapter_pattern, text, re.DOTALL | re.IGNORECASE)
    chapters = {}
    roman_to_num = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18}
    for num_rom, content in matches[:10]:  # First 10 chapters (Liberty + part of Dominion)
        num = roman_to_num.get(num_rom.upper(), len(chapters) + 1)
        content = content.strip()[:2500]
        if len(content) > 200:
            chapters[str(num)] = {
                "chapter": num_rom,
                "text": content,
                "themes": extract_themes(content),
                "work": "De Cive (Philosophical Rudiments)",
            }
    topic_mapping = {
        "power": list(chapters.keys()),
        "nature": list(chapters.keys()),
        "government": list(chapters.keys()),
        "law": list(chapters.keys()),
    }
    return {"chapters": chapters, "topic_mapping": topic_mapping}


def process_hobbes():
    """Process Leviathan + De Cive - merged index."""
    with open(DATA_DIR / "hobbes" / "leviathan.txt") as f:
        text = clean_text(f.read())
    part1 = re.search(
        r"PART I.*?OF MAN(.*?)(?=PART II|$)", text, re.DOTALL | re.IGNORECASE
    )
    part2 = re.search(
        r"PART II.*?OF COMMONWEALTH(.*?)(?=PART III|$)", text, re.DOTALL | re.IGNORECASE
    )
    part3 = re.search(
        r"PART III.*?OF A CHRISTIAN COMMONWEALTH(.*?)(?=PART IV|$)",
        text,
        re.DOTALL | re.IGNORECASE,
    )
    part4 = re.search(
        r"PART IV.*?OF THE KINGDOM OF DARKNESS(.*?)$", text, re.DOTALL | re.IGNORECASE
    )
    parts = {
        "1": {
            "part": "1",
            "text": part1.group(1)[:3000] if part1 else "",
            "themes": ["man", "nature", "reason", "passions"],
            "work": "Leviathan",
        },
        "2": {
            "part": "2",
            "text": part2.group(1)[:3000] if part2 else "",
            "themes": ["commonwealth", "sovereign", "laws"],
            "work": "Leviathan",
        },
        "3": {
            "part": "3",
            "text": part3.group(1)[:3000] if part3 else "",
            "themes": ["christian", "religion", "church"],
            "work": "Leviathan",
        },
        "4": {
            "part": "4",
            "text": part4.group(1)[:3000] if part4 else "",
            "themes": ["darkness", "superstition"],
            "work": "Leviathan",
        },
    }
    topic_mapping = {
        "power": ["1", "2", "3", "4"],
        "sovereign": ["2", "3", "4"],
        "authority": ["2", "3"],
        "fear": ["1", "2"],
        "nature": ["1", "2"],
        "war": ["1", "2"],
        "freedom": ["1", "2"],
        "law": ["2", "3", "4"],
        "rights": ["1", "2"],
        "contract": ["2"],
        "commonwealth": ["2"],
        "government": ["2"],
        "church": ["3", "4"],
        "religion": ["3", "4"],
    }
    de_cive = _process_de_cive()
    dc_prefixed = _prefix_sections(de_cive["chapters"], "de_cive", "De Cive (Philosophical Rudiments)")
    parts = {**parts, **dc_prefixed}
    topic_mapping = _merge_topic_mappings(topic_mapping, de_cive["topic_mapping"], "de_cive")
    return {"parts": parts, "topic_mapping": topic_mapping}


def _prefix_sections(sections_dict, prefix, work_name, _section_key=None):
    """Prefix section IDs and add work field."""
    result = {}
    for i, (sid, data) in enumerate(sections_dict.items(), 1):
        new_id = f"{prefix}_{sid}"
        result[new_id] = {**data, "work": work_name}
    return result


def _merge_topic_mappings(map1, map2, prefix):
    """Merge two topic_mappings; map2's IDs get prefixed."""
    merged = dict(map1)
    for kw, ids in map2.items():
        prefixed = [f"{prefix}_{i}" for i in ids]
        merged[kw] = list(set(merged.get(kw, [])) | set(prefixed))
    return merged


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
        "thoreau": process_thoreau,
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
