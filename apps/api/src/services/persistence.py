import sqlite3
import json
import asyncio
import time
from pathlib import Path
from typing import Optional
from ..models.schemas import DebateState


class DebatePersistence:
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.db_path = (
            Path(__file__).parent.parent.parent.parent.parent / "data" / "debates.db"
        )
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS debates (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at REAL NOT NULL
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_updated_at ON debates(updated_at)
            """)
            conn.commit()

    async def save(self, debate: DebateState):
        async with self._lock:

            def _save():
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO debates (id, data, updated_at)
                        VALUES (?, ?, ?)
                        """,
                        (debate.id, debate.model_dump_json(), time.time()),
                    )
                    conn.commit()

            await asyncio.to_thread(_save)

    async def get(self, debate_id: str) -> Optional[DebateState]:
        def _get():
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    "SELECT data FROM debates WHERE id = ?", (debate_id,)
                )
                row = cursor.fetchone()
                if row:
                    return DebateState.model_validate_json(row[0])
                return None

        return await asyncio.to_thread(_get)

    async def delete(self, debate_id: str) -> bool:
        async with self._lock:

            def _delete():
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.execute(
                        "DELETE FROM debates WHERE id = ?", (debate_id,)
                    )
                    conn.commit()
                    return cursor.rowcount > 0

            return await asyncio.to_thread(_delete)

    async def cleanup_old(self, max_age_hours: int = 24):
        async with self._lock:

            def _cleanup():
                cutoff = time.time() - (max_age_hours * 3600)
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("DELETE FROM debates WHERE updated_at < ?", (cutoff,))
                    conn.commit()

            await asyncio.to_thread(_cleanup)


debate_persistence = DebatePersistence()
