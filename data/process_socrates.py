#!/usr/bin/env python3
"""Process Plato's Dialogues from Project Gutenberg into structured JSON."""

import json
import re
from pathlib import Path


def extract_dialogue(filepath: str, dialogue_name: str) -> dict:
    """Extract dialogue text from Gutenberg file."""

    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    # Find start marker
    start_marker = "*** START OF"
    start_idx = text.find(start_marker)
    if start_idx != -1:
        start_idx = text.find("\n", start_idx) + 1
    else:
        start_idx = 0

    # Find end marker
    end_marker = "*** END OF"
    end_idx = text.find(end_marker)
    if end_idx == -1:
        end_idx = len(text)

    text = text[start_idx:end_idx].strip()

    # Remove intro sections if present (look for the dialogue title)
    # Pattern: Look for the dialogue name followed by content
    title_pattern = re.compile(rf"^{dialogue_name}\s*$", re.IGNORECASE | re.MULTILINE)
    match = title_pattern.search(text)
    if match:
        # Find the actual content start after the title
        text = text[match.end() :].strip()

    # Clean up
    text = re.sub(r"\n{3,}", "\n\n", text)

    return {"text": text, "word_count": len(text.split())}


def process_socrates(input_dir: str, output_dir: str):
    """Process all Socrates/Plato dialogues."""

    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    dialogues = {}
    dialogue_index = {"dialogues": {}, "topic_mapping": {}}

    # Process each dialogue
    dialogue_files = [
        (
            "plato_dialogues_raw.txt",
            "apology",
            "Apology",
            "Socrates' defense at his trial, 399 BCE",
            ["justice", "truth", "examined life", "death", "duty"],
        ),
        (
            "crito_raw.txt",
            "crito",
            "Crito",
            "Dialogue in prison; Crito urges escape",
            ["obedience to law", "justice", "promises", "civil disobedience"],
        ),
        (
            "euthyphro_raw.txt",
            "euthyphro",
            "Euthyphro",
            "Dialogue on piety before the trial",
            ["piety", "definition", "morality", "gods"],
        ),
        (
            "phaedo_raw.txt",
            "phaedo",
            "Phaedo",
            "Socrates' final dialogue on the soul and death",
            ["death", "soul", "immortality", "philosophy"],
        ),
    ]

    for filename, dialogue_id, dialogue_name, context, themes in dialogue_files:
        filepath = input_path / filename
        if filepath.exists():
            print(f"Processing {dialogue_name}...")
            dialogue_data = extract_dialogue(str(filepath), dialogue_name)
            dialogues[dialogue_id] = {
                "title": dialogue_name,
                "context": context,
                "text": dialogue_data["text"],
                "word_count": dialogue_data["word_count"],
            }
            dialogue_index["dialogues"][dialogue_id] = {
                "title": dialogue_name,
                "context": context,
                "themes": themes,
                "word_count": dialogue_data["word_count"],
            }

    # Create topic mapping
    dialogue_index["topic_mapping"] = {
        "justice": ["apology", "crito"],
        "truth": ["apology"],
        "examined life": ["apology"],
        "death": ["apology", "phaedo"],
        "duty": ["apology", "crito"],
        "obedience": ["crito"],
        "law": ["crito", "apology"],
        "civil disobedience": ["crito"],
        "piety": ["euthyphro"],
        "morality": ["euthyphro", "apology"],
        "gods": ["euthyphro", "apology"],
        "soul": ["phaedo", "apology"],
        "immortality": ["phaedo"],
        "breaking": ["crito"],
        "right": ["crito", "apology"],
        "wrong": ["crito", "apology"],
    }

    # Save files
    with open(output_path / "dialogues.json", "w", encoding="utf-8") as f:
        json.dump(dialogues, f, indent=2, ensure_ascii=False)

    with open(output_path / "dialogue_index.json", "w", encoding="utf-8") as f:
        json.dump(dialogue_index, f, indent=2, ensure_ascii=False)

    print(f"\nProcessed {len(dialogues)} dialogues:")
    for dial_id, dial_data in dialogues.items():
        print(f"  {dial_id}: {dial_data['title']} ({dial_data['word_count']} words)")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    input_dir = Path(__file__).parent / "figures" / "socrates"
    output_dir = Path(__file__).parent / "figures" / "socrates"
    process_socrates(str(input_dir), str(output_dir))
