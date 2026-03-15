import json
from collections import OrderedDict
from pathlib import Path
from typing import Optional

try:
    from .embedding_service import embedding_service
except ImportError:
    embedding_service = None

FIGURE_SOURCE_TYPES: dict[str, str] = {
    "epictetus": "Section",
    "mill": "Chapter",
    "aurelius": "Book",
    "locke": "Chapter",
    "rousseau": "Book",
    "nietzsche": "Part",
    "hobbes": "Part",
    "plato": "Book",
    "aristotle": "Book",
    "hume": "Section",
    "kant": "Section",
    "wollstonecraft": "Chapter",
    "marx": "Part",
    "thoreau": "Section",
    "seneca": "Letter",
    "cicero": "Book",
    "lucretius": "Book",
    "descartes": "Meditation",
    "spinoza": "Part",
    "leibniz": "Section",
    "voltaire": "Chapter",
    "paine": "Section",
    "burke": "Section",
    "douglass": "Chapter",
    "emerson": "Essay",
    "dubois": "Chapter",
    "darwin": "Chapter",
    "james": "Lecture",
    "tocqueville": "Chapter",
    "russell": "Chapter",
}


class LRUCache:
    """Simple LRU cache with max size to prevent unbounded memory growth."""

    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self._data: OrderedDict = OrderedDict()

    def get(self, key: str):
        if key in self._data:
            self._data.move_to_end(key)
            return self._data[key]
        return None

    def set(self, key: str, value):
        if key in self._data:
            self._data.move_to_end(key)
        self._data[key] = value
        while len(self._data) > self.max_size:
            self._data.popitem(last=False)

    def __contains__(self, key: str) -> bool:
        return key in self._data

    def __getitem__(self, key: str):
        return self.get(key)

    def __setitem__(self, key: str, value):
        self.set(key, value)


class RetrievalService:
    _instance = None
    _shared_cache = LRUCache(100)
    _shared_embedding_cache = LRUCache(50)

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.data_path = (
            Path(__file__).parent.parent.parent.parent.parent / "data" / "figures"
        )
        self._cache = self._shared_cache
        self._embedding_cache = self._shared_embedding_cache

    def _load_json(self, figure: str, filename: str) -> dict:
        cache_key = f"{figure}/{filename}"
        if cache_key not in self._cache:
            file_path = self.data_path / figure / filename
            if file_path.exists():
                with open(file_path) as f:
                    self._cache[cache_key] = json.load(f)
            else:
                self._cache[cache_key] = {}
        return self._cache[cache_key]

    def get_context_for_machiavelli(self, topic: str, user_argument: str) -> dict:
        index = self._load_json("machiavelli", "chapter_index.json")
        texts = self._load_json("machiavelli", "the_prince.json")

        if not index or not texts:
            return {
                "chapters": [],
                "formatted": "",
                "chapter_ids": [],
                "sources": [],
                "passages": [],
            }

        topic_lower = (topic + " " + user_argument).lower()
        chapter_ids = set()

        for keyword, chapters in index.get("topic_mapping", {}).items():
            if keyword in topic_lower:
                chapter_ids.update(chapters)

        if not chapter_ids:
            for ch_id, ch_data in index.get("chapters", {}).items():
                themes = ch_data.get("themes", [])
                if any(theme in topic_lower for theme in themes):
                    chapter_ids.add(ch_id)

        if not chapter_ids:
            chapter_ids = {"17"}

        # Dynamic count: weak match -> take more (up to 4)
        ch_list = list(chapter_ids)
        if len(ch_list) <= 1:
            all_ch_ids = list(index.get("chapters", {}).keys())
            for cid in all_ch_ids:
                if cid not in ch_list and len(ch_list) < 4:
                    ch_list.append(cid)
        else:
            ch_list = ch_list[:2]
        chapter_ids = ch_list

        chapters = []
        formatted_parts = []

        for ch_id in chapter_ids:
            ch_info = index.get("chapters", {}).get(ch_id, {})
            ch_text = texts.get("chapters", {}).get(ch_id, {})

            if ch_text:
                chapters.append(
                    {
                        "chapter": ch_id,
                        "title": ch_info.get("title", ""),
                        "text": ch_text.get("text", "")[:2000],
                        "themes": ch_info.get("themes", []),
                    }
                )
                formatted_parts.append(
                    f"=== CHAPTER {ch_id}: {ch_info.get('title', '')} ===\n{ch_text.get('text', '')[:2000]}"
                )

        return {
            "chapters": chapters,
            "formatted": "\n\n".join(formatted_parts),
            "chapter_ids": chapter_ids,
        }

    def get_context_for_socrates(self, topic: str, user_argument: str) -> dict:
        index = self._load_json("socrates", "dialogue_index.json")
        texts = self._load_json("socrates", "dialogues.json")

        if not index or not texts:
            return {
                "dialogues": [],
                "formatted": "",
                "dialogue_ids": [],
                "sources": [],
                "passages": [],
            }

        topic_lower = (topic + " " + user_argument).lower()
        dialogue_ids = set()

        # Map topic IDs to dialogue keywords
        topic_id_mapping = {
            "breaking_law": ["law", "breaking", "civil disobedience", "obedience"],
            "examined_life": ["examined life", "truth", "wisdom"],
            "virtue_teachable": ["virtue", "morality", "teaching"],
            "what_is_justice": ["justice", "right", "wrong"],
            "fear_death": ["death", "soul", "immortality"],
        }

        # Check topic ID first
        for topic_id, keywords in topic_id_mapping.items():
            if topic_id in topic_lower or any(kw in topic_lower for kw in keywords):
                for kw in keywords:
                    if kw in index.get("topic_mapping", {}):
                        dialogue_ids.update(index["topic_mapping"][kw])

        # Fallback to keyword matching
        if not dialogue_ids:
            for keyword, dialogues in index.get("topic_mapping", {}).items():
                if keyword in topic_lower:
                    dialogue_ids.update(dialogues)

        if not dialogue_ids:
            for dial_id, dial_data in index.get("dialogues", {}).items():
                themes = dial_data.get("themes", [])
                if any(theme in topic_lower for theme in themes):
                    dialogue_ids.add(dial_id)

        if not dialogue_ids:
            dialogue_ids = {"apology"}

        # Dynamic count: weak match -> take more (up to 4)
        dial_list = list(dialogue_ids)
        if len(dial_list) <= 1:
            all_dial_ids = list(index.get("dialogues", {}).keys())
            for did in all_dial_ids:
                if did not in dial_list and len(dial_list) < 4:
                    dial_list.append(did)
        else:
            dial_list = dial_list[:2]
        dialogue_ids = dial_list

        dialogues = []
        formatted_parts = []

        for dial_id in dialogue_ids:
            dial_info = index.get("dialogues", {}).get(dial_id, {})
            dial_text = texts.get(dial_id, {})

            if dial_text:
                dialogues.append(
                    {
                        "id": dial_id,
                        "title": dial_info.get("title", ""),
                        "context": dial_info.get("context", ""),
                        "text": dial_text.get("text", "")[:2000],
                        "themes": dial_info.get("themes", []),
                    }
                )
                formatted_parts.append(
                    f"=== {dial_info.get('title', '').upper()} ===\n"
                    f"Context: {dial_info.get('context', '')}\n\n"
                    f"{dial_text.get('text', '')[:2000]}"
                )

        return {
            "dialogues": dialogues,
            "formatted": "\n\n".join(formatted_parts),
            "dialogue_ids": dialogue_ids,
        }

    def _generic_retrieval(
        self, figure: str, topic: str, user_argument: str, source_name: str
    ) -> dict:
        """Generic retrieval for new figures using their index.json."""
        index = self._load_json(figure, "index.json")

        if not index:
            return {"sources": [], "formatted": "", "source_ids": [], "passages": []}

        topic_lower = (topic + " " + user_argument).lower()
        source_ids = set()

        # Resolve sections once (first non-empty of sections, chapters, books, parts)
        sections = (
            index.get("sections")
            or index.get("chapters")
            or index.get("books")
            or index.get("parts")
            or {}
        )
        section_keys = list(sections.keys())

        topic_mapping = index.get("topic_mapping", {})

        for keyword, topic_sections in topic_mapping.items():
            if keyword in topic_lower:
                source_ids.update(topic_sections)

        # Fallback to theme matching
        if not source_ids:
            for section_id, section_data in sections.items():
                themes = section_data.get("themes", [])
                if any(theme in topic_lower for theme in themes):
                    source_ids.add(section_id)

        # Final fallback: first section
        if not source_ids and section_keys:
            source_ids = {section_keys[0]}

        # Dynamic count: weak match (0-1 sections) -> expand to up to 4
        result_ids = list(source_ids)
        if len(result_ids) <= 1 and section_keys:
            for k in section_keys:
                if k not in result_ids and len(result_ids) < 4:
                    result_ids.append(k)
        else:
            result_ids = result_ids[:2]
        source_ids = result_ids

        formatted_parts = []
        sources = []
        passages = []

        for sid in source_ids:
            section = sections.get(sid, {})
            text = section.get("text", "")
            if text:
                title = section.get(
                    "section",
                    section.get(
                        "chapter", section.get("book", section.get("part", sid))
                    ),
                )
                formatted_parts.append(
                    f"=== {source_name.upper()} {title}: ===\n{text[:2000]}"
                )
                sources.append(f"{source_name.title()} {title}")
                passages.append(
                    {
                        "source_id": sid,
                        "title": str(title),
                        "text_excerpt": self._to_excerpt(text),
                    }
                )

        return {
            "sources": sources,
            "formatted": "\n\n".join(formatted_parts),
            "source_ids": source_ids,
            "passages": passages,
        }

    def _to_excerpt(self, text: str, max_len: int = 500) -> str:
        if not text:
            return ""
        return text[:max_len] + ("..." if len(text) > max_len else "")

    def _get_source_type(self, figure: str) -> str:
        """Return the unit type (Chapter, Section, etc.) for a figure's sources."""
        return FIGURE_SOURCE_TYPES.get(figure, "Section")

    def list_loaded_sources(self, figure: str) -> list[dict]:
        """Return list of loaded sources for a figure: [{id, title, type}]."""
        source_type = self._get_source_type(figure)
        if figure == "machiavelli":
            index = self._load_json("machiavelli", "chapter_index.json")
            texts = self._load_json("machiavelli", "the_prince.json")
            if not index or not texts:
                return []
            result = []
            for ch_id, ch_info in index.get("chapters", {}).items():
                if texts.get("chapters", {}).get(ch_id, {}).get("text"):
                    item = {
                        "id": ch_id,
                        "title": ch_info.get("title", ch_id),
                        "type": "Chapter",
                    }
                    if ch_info.get("work"):
                        item["work"] = ch_info["work"]
                    result.append(item)
            return result
        elif figure == "socrates":
            index = self._load_json("socrates", "dialogue_index.json")
            texts = self._load_json("socrates", "dialogues.json")
            if not index or not texts:
                return []
            result = []
            for dial_id, dial_info in index.get("dialogues", {}).items():
                if texts.get(dial_id, {}).get("text"):
                    item = {
                        "id": dial_id,
                        "title": dial_info.get("title", dial_id),
                        "type": "Dialogue",
                    }
                    if dial_info.get("work"):
                        item["work"] = dial_info["work"]
                    result.append(item)
            return result
        else:
            index = self._load_json(figure, "index.json")
            if not index:
                return []
            secs = (
                index.get("sections")
                or index.get("chapters")
                or index.get("books")
                or index.get("parts")
                or {}
            )
            result = []
            for sid, data in secs.items():
                if data.get("text"):
                    title = (
                        data.get("section")
                        or data.get("chapter")
                        or data.get("book")
                        or data.get("part")
                        or sid
                    )
                    item = {"id": sid, "title": str(title), "type": source_type}
                    if data.get("work"):
                        item["work"] = data["work"]
                    result.append(item)
            return result

    def _load_embeddings(self, figure: str) -> Optional[dict]:
        emb_path = self.data_path / figure / "embeddings.json"
        if not emb_path.exists():
            return None
        mtime = emb_path.stat().st_mtime
        cached = self._embedding_cache.get(figure)
        if cached and cached.get("mtime") == mtime:
            return cached.get("data")
        try:
            embs = json.loads(emb_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None
        if not isinstance(embs, dict):
            return None
        self._embedding_cache[figure] = {"mtime": mtime, "data": embs}
        return embs

    def _get_context_semantic(
        self, figure: str, topic: str, user_argument: str
    ) -> dict | None:
        """Use embeddings when available. Returns None to fall back to keyword."""
        if not embedding_service or not embedding_service._client:
            return None
        embs = self._load_embeddings(figure)
        if not embs:
            return None
        query = f"{topic} {user_argument}".strip()
        query_vec = embedding_service.embed(query)
        if not query_vec:
            return None
        scored = []
        for sid, vec in embs.items():
            sim = embedding_service.cosine_similarity(query_vec, vec)
            scored.append((sid, sim))
        scored.sort(key=lambda x: -x[1])
        top = scored[:4] if len(scored) <= 1 else scored[:2]
        if not top:
            return None
        return self._build_context_from_ids(figure, [s[0] for s in top])

    def _build_context_from_ids(self, figure: str, source_ids: list[str]) -> dict:
        """Build context dict from semantic-selected ids. Uses figure-specific logic."""
        if figure == "machiavelli":
            index = self._load_json("machiavelli", "chapter_index.json")
            texts = self._load_json("machiavelli", "the_prince.json")
            chapters = []
            formatted_parts = []
            for ch_id in source_ids:
                ch_info = index.get("chapters", {}).get(ch_id, {})
                ch_text = texts.get("chapters", {}).get(ch_id, {})
                if ch_text:
                    text = ch_text.get("text", "")[:2000]
                    chapters.append(
                        {
                            "chapter": ch_id,
                            "title": ch_info.get("title", ""),
                            "text": text,
                            "themes": ch_info.get("themes", []),
                        }
                    )
                    formatted_parts.append(
                        f"=== CHAPTER {ch_id}: {ch_info.get('title', '')} ===\n{text}"
                    )
            return {
                "chapters": chapters,
                "formatted": "\n\n".join(formatted_parts),
                "chapter_ids": source_ids,
                "sources": [f"Chapter {c}" for c in source_ids],
                "passages": [
                    {
                        "source_id": c.get("chapter", ""),
                        "title": c.get("title", ""),
                        "text_excerpt": self._to_excerpt(c.get("text", "")),
                    }
                    for c in chapters
                ],
            }
        elif figure == "socrates":
            index = self._load_json("socrates", "dialogue_index.json")
            texts = self._load_json("socrates", "dialogues.json")
            dialogues = []
            formatted_parts = []
            for dial_id in source_ids:
                dial_info = index.get("dialogues", {}).get(dial_id, {})
                dial_text = texts.get(dial_id, {})
                if dial_text:
                    text = dial_text.get("text", "")[:2000]
                    dialogues.append(
                        {
                            "id": dial_id,
                            "title": dial_info.get("title", ""),
                            "text": text,
                        }
                    )
                    formatted_parts.append(
                        f"=== {dial_info.get('title', '').upper()} ===\n{text}"
                    )
            return {
                "dialogues": dialogues,
                "formatted": "\n\n".join(formatted_parts),
                "dialogue_ids": source_ids,
                "sources": [f"Dialogue {d}" for d in source_ids],
                "passages": [
                    {
                        "source_id": d.get("id", ""),
                        "title": d.get("title", ""),
                        "text_excerpt": self._to_excerpt(d.get("text", "")),
                    }
                    for d in dialogues
                ],
            }
        else:
            return self._generic_build_from_ids(figure, source_ids)

    def _generic_build_from_ids(self, figure: str, source_ids: list[str]) -> dict:
        index = self._load_json(figure, "index.json")
        if not index:
            return {"sources": [], "formatted": "", "passages": []}
        secs = (
            index.get("sections")
            or index.get("chapters")
            or index.get("books")
            or index.get("parts")
            or {}
        )
        source_name = FIGURE_SOURCE_TYPES.get(figure, "Section")
        formatted_parts = []
        sources = []
        passages = []
        for sid in source_ids:
            section = secs.get(sid, {})
            text = section.get("text", "")
            if text:
                title = (
                    section.get("section")
                    or section.get("chapter")
                    or section.get("book")
                    or section.get("part")
                    or sid
                )
                formatted_parts.append(
                    f"=== {source_name.upper()} {title}: ===\n{text[:2000]}"
                )
                sources.append(f"{source_name.title()} {title}")
                passages.append(
                    {
                        "source_id": sid,
                        "title": str(title),
                        "text_excerpt": self._to_excerpt(text),
                    }
                )
        return {
            "sources": sources,
            "formatted": "\n\n".join(formatted_parts),
            "passages": passages,
        }

    def get_context(self, figure: str, topic: str, user_argument: str) -> dict:
        semantic_result = self._get_context_semantic(figure, topic, user_argument)
        if semantic_result is not None:
            return semantic_result

        if figure == "machiavelli":
            result = self.get_context_for_machiavelli(topic, user_argument)
            result["sources"] = [
                f"Chapter {ch}" for ch in result.get("chapter_ids", [])
            ]
            chapters = result.get("chapters", [])
            result["passages"] = [
                {
                    "source_id": ch.get("chapter", ""),
                    "title": ch.get("title", ""),
                    "text_excerpt": self._to_excerpt(ch.get("text", "")),
                }
                for ch in chapters
            ]
            return result
        elif figure == "socrates":
            result = self.get_context_for_socrates(topic, user_argument)
            result["sources"] = [
                f"Dialogue {d}" for d in result.get("dialogue_ids", [])
            ]
            dialogues = result.get("dialogues", [])
            result["passages"] = [
                {
                    "source_id": d.get("id", ""),
                    "title": d.get("title", ""),
                    "text_excerpt": self._to_excerpt(d.get("text", "")),
                }
                for d in dialogues
            ]
            return result
        elif figure == "epictetus":
            return self._generic_retrieval("epictetus", topic, user_argument, "Section")
        elif figure == "mill":
            return self._generic_retrieval("mill", topic, user_argument, "Chapter")
        elif figure == "aurelius":
            return self._generic_retrieval("aurelius", topic, user_argument, "Book")
        elif figure == "locke":
            return self._generic_retrieval("locke", topic, user_argument, "Chapter")
        elif figure == "rousseau":
            return self._generic_retrieval("rousseau", topic, user_argument, "Book")
        elif figure == "nietzsche":
            return self._generic_retrieval("nietzsche", topic, user_argument, "Part")
        elif figure == "hobbes":
            return self._generic_retrieval("hobbes", topic, user_argument, "Part")
        elif figure == "plato":
            return self._generic_retrieval("plato", topic, user_argument, "Book")
        elif figure == "aristotle":
            return self._generic_retrieval("aristotle", topic, user_argument, "Book")
        elif figure == "hume":
            return self._generic_retrieval("hume", topic, user_argument, "Section")
        elif figure == "kant":
            return self._generic_retrieval("kant", topic, user_argument, "Section")
        elif figure == "wollstonecraft":
            return self._generic_retrieval(
                "wollstonecraft", topic, user_argument, "Chapter"
            )
        elif figure == "marx":
            return self._generic_retrieval("marx", topic, user_argument, "Part")
        elif figure == "thoreau":
            return self._generic_retrieval("thoreau", topic, user_argument, "Section")
        elif figure == "seneca":
            return self._generic_retrieval("seneca", topic, user_argument, "Letter")
        elif figure == "cicero":
            return self._generic_retrieval("cicero", topic, user_argument, "Book")
        elif figure == "lucretius":
            return self._generic_retrieval("lucretius", topic, user_argument, "Book")
        elif figure == "descartes":
            return self._generic_retrieval(
                "descartes", topic, user_argument, "Meditation"
            )
        elif figure == "spinoza":
            return self._generic_retrieval("spinoza", topic, user_argument, "Part")
        elif figure == "leibniz":
            return self._generic_retrieval("leibniz", topic, user_argument, "Section")
        elif figure == "voltaire":
            return self._generic_retrieval("voltaire", topic, user_argument, "Chapter")
        elif figure == "paine":
            return self._generic_retrieval("paine", topic, user_argument, "Section")
        elif figure == "burke":
            return self._generic_retrieval("burke", topic, user_argument, "Section")
        elif figure == "douglass":
            return self._generic_retrieval("douglass", topic, user_argument, "Chapter")
        elif figure == "emerson":
            return self._generic_retrieval("emerson", topic, user_argument, "Essay")
        elif figure == "dubois":
            return self._generic_retrieval("dubois", topic, user_argument, "Chapter")
        elif figure == "darwin":
            return self._generic_retrieval("darwin", topic, user_argument, "Chapter")
        elif figure == "james":
            return self._generic_retrieval("james", topic, user_argument, "Lecture")
        elif figure == "tocqueville":
            return self._generic_retrieval(
                "tocqueville", topic, user_argument, "Chapter"
            )
        elif figure == "russell":
            return self._generic_retrieval("russell", topic, user_argument, "Chapter")
        return {"formatted": "", "sources": [], "passages": []}


retrieval_service = RetrievalService()
