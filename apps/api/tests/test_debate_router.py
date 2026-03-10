import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

# Ensure required env vars exist before importing application modules.
os.environ.setdefault("GROK_API_KEY", "test-key")

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from src.models.schemas import DebateMode, DebateState, Figure  # noqa: E402
from src.routers import debate as debate_router  # noqa: E402


class DebateRouterLockingTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        debate_router._debate_locks.clear()

    async def test_lock_ref_count_is_cleaned_up(self) -> None:
        lock_a1 = await debate_router._acquire_debate_lock("debate-1")
        lock_a2 = await debate_router._acquire_debate_lock("debate-1")

        self.assertIs(lock_a1, lock_a2)
        self.assertEqual(debate_router._debate_locks["debate-1"]["ref_count"], 2)

        await debate_router._release_debate_lock("debate-1")
        self.assertEqual(debate_router._debate_locks["debate-1"]["ref_count"], 1)

        await debate_router._release_debate_lock("debate-1")
        self.assertNotIn("debate-1", debate_router._debate_locks)

    async def test_end_debate_sets_completed_and_releases_lock(self) -> None:
        debate = DebateState(
            id="debate-2",
            figure=Figure.machiavelli,
            topic="Fear vs Love",
            topic_id="fear-vs-love",
            mode=DebateMode.debate,
            max_turns=3,
            current_turn=1,
            turns=[],
            created_at=0.0,
            status="active",
            opening_statement="Opening statement",
        )

        with (
            patch.object(
                debate_router.debate_persistence, "get", AsyncMock(return_value=debate)
            ) as mocked_get,
            patch.object(
                debate_router.debate_persistence, "save", AsyncMock()
            ) as mocked_save,
        ):
            result = await debate_router.end_debate("debate-2")

        self.assertEqual(result["debate"]["status"], "completed")
        mocked_get.assert_awaited_once_with("debate-2")
        mocked_save.assert_awaited_once()
        self.assertNotIn("debate-2", debate_router._debate_locks)

    async def test_delete_debate_not_found_releases_lock(self) -> None:
        with patch.object(
            debate_router.debate_persistence, "delete", AsyncMock(return_value=False)
        ) as mocked_delete:
            with self.assertRaises(HTTPException) as ctx:
                await debate_router.delete_debate("missing-id")

        self.assertEqual(ctx.exception.status_code, 404)
        mocked_delete.assert_awaited_once_with("missing-id")
        self.assertNotIn("missing-id", debate_router._debate_locks)


if __name__ == "__main__":
    unittest.main()
