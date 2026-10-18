import unittest
from unittest.mock import patch

from watchdog import ProbeState, probe, validate_url


class WatchdogTests(unittest.TestCase):
    def test_hysteresis_and_duplicate_suppression(self):
        state = ProbeState()
        self.assertIsNone(state.observe(False))
        self.assertIsNone(state.observe(False))
        self.assertEqual(state.observe(False), "MONITOR_UNAVAILABLE")
        self.assertIsNone(state.observe(False))
        self.assertIsNone(state.observe(True))
        self.assertEqual(state.observe(True), "MONITOR_RECOVERED")
        self.assertIsNone(state.observe(True))

    def test_reject_credentials_and_non_https_webhook(self):
        with self.assertRaises(ValueError):
            validate_url("http://secret:password@host/health")
        with self.assertRaises(ValueError):
            validate_url("http://host/hook", webhook=True)

    def test_unreachable_is_not_healthy(self):
        with patch("urllib.request.OpenerDirector.open", side_effect=OSError("offline")):
            self.assertFalse(probe("http://127.0.0.1/health"))


if __name__ == "__main__":
    unittest.main()
