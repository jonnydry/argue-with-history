#!/usr/bin/env python3
"""Process The Prince from Project Gutenberg into structured JSON."""

import json
import re
from pathlib import Path


def roman_to_int(roman: str) -> int:
    """Convert Roman numeral to integer."""
    values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    result = 0
    for i, char in enumerate(roman):
        if i + 1 < len(roman) and values[char] < values[roman[i + 1]]:
            result -= values[char]
        else:
            result += values[char]
    return result


def parse_the_prince(input_path: str, output_dir: str):
    """Parse raw text into structured JSON."""

    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find chapter start lines (pattern: "CHAPTER X." or "CHAPTER X.[1]" on its own line)
    chapter_starts = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        match = re.match(r"^CHAPTER\s+([IVXLCDM]+)\.", stripped)
        if match:
            # Make sure this is a standalone chapter header (not in TOC)
            # TOC entries have the title on the same line
            if stripped == line.rstrip("\n") and not re.search(
                r"[A-Z]{5,}", stripped[match.end() :]
            ):
                chapter_starts.append((i, match.group(1)))

    print(f"Found {len(chapter_starts)} chapter starts")

    chapters = {}
    chapter_index = {"chapters": {}, "topic_mapping": {}}

    for idx, (line_num, roman) in enumerate(chapter_starts):
        arabic = roman_to_int(roman)

        # Get title (next non-empty line after chapter marker)
        title_line = line_num + 1
        while title_line < len(lines) and not lines[title_line].strip():
            title_line += 1

        title = lines[title_line].strip() if title_line < len(lines) else ""

        # Get content (from after title until next chapter or end marker)
        content_start = title_line + 1
        while content_start < len(lines) and not lines[content_start].strip():
            content_start += 1

        content_end = len(lines)
        if idx + 1 < len(chapter_starts):
            content_end = chapter_starts[idx + 1][0]
        else:
            # Find end marker
            for i in range(content_start, len(lines)):
                if any(
                    marker in lines[i]
                    for marker in [
                        "DESCRIPTION OF THE METHODS",
                        "THE LIFE OF CASTRUCCIO",
                        "*** END OF",
                    ]
                ):
                    content_end = i
                    break

        body = "".join(lines[content_start:content_end]).strip()
        body = re.sub(r"\n{3,}", "\n\n", body)

        # Detect themes from content
        themes = []
        body_lower = body.lower()
        if "fear" in body_lower or "love" in body_lower:
            themes.extend(["fear", "love"])
        if "cruel" in body_lower:
            themes.append("cruelty")
        if "prince" in body_lower:
            themes.append("power")
        if "war" in body_lower or "army" in body_lower or "soldier" in body_lower:
            themes.append("war")
        if "fortune" in body_lower:
            themes.append("fortune")
        if "virtue" in body_lower or "virtù" in body_lower:
            themes.append("virtue")
        if "promise" in body_lower or "faith" in body_lower or "break" in body_lower:
            themes.extend(["promises", "honesty"])
        if "generous" in body_lower or "liberal" in body_lower or "mean" in body_lower:
            themes.extend(["generosity", "stinginess"])
        themes = list(set(themes))

        chapters[str(arabic)] = {
            "title": title,
            "text": body,
            "word_count": len(body.split()),
        }

        chapter_index["chapters"][str(arabic)] = {
            "title": title,
            "themes": themes,
            "word_count": len(body.split()),
        }

    # Create topic mapping based on known chapter themes
    chapter_index["topic_mapping"] = {
        "fear vs love": ["17"],
        "fear": ["17"],
        "love": ["17"],
        "power": ["7", "8", "17", "19", "25"],
        "fortune": ["25"],
        "virtue": ["6", "7", "8", "14", "15", "16"],
        "war": ["12", "13", "14"],
        "promises": ["18"],
        "honesty": ["18"],
        "cruelty": ["17"],
        "generosity": ["16"],
        "stingy": ["16"],
        "advisors": ["22", "23"],
        "flattery": ["23"],
        "conquest": ["3", "4", "5"],
        "means": ["18"],
        "end": ["18"],
        "better": ["17", "18"],
        "despised": ["19"],
        "hated": ["19"],
    }

    # Save files
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    with open(output_path / "the_prince.json", "w", encoding="utf-8") as f:
        json.dump({"chapters": chapters}, f, indent=2, ensure_ascii=False)

    with open(output_path / "chapter_index.json", "w", encoding="utf-8") as f:
        json.dump(chapter_index, f, indent=2, ensure_ascii=False)

    print(f"Processed {len(chapters)} chapters")
    for ch_num, ch_data in sorted(chapters.items(), key=lambda x: int(x[0])):
        print(f"  Chapter {ch_num}: {ch_data['title'][:60]}...")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    input_file = (
        Path(__file__).parent / "figures" / "machiavelli" / "the_prince_raw.txt"
    )
    output_dir = Path(__file__).parent / "figures" / "machiavelli"
    parse_the_prince(str(input_file), str(output_dir))
