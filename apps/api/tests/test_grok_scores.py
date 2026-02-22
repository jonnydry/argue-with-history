import os
import sys
import unittest
from pathlib import Path

# Ensure required env vars exist before importing application modules.
os.environ.setdefault("GROK_API_KEY", "test-key")

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from src.services.grok_service import _coerce_score  # noqa: E402


class CoerceScoreTests(unittest.TestCase):
    def test_handles_two_digit_strings(self) -> None:
        self.assertEqual(_coerce_score("10"), 10)

    def test_clamps_over_max(self) -> None:
        self.assertEqual(_coerce_score("12"), 10)

    def test_fallback_for_invalid_input(self) -> None:
        self.assertEqual(_coerce_score("great"), 5)


if __name__ == "__main__":
    unittest.main()
