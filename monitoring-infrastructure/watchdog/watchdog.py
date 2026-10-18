"""Run on a separate host to supervise the monitor without its DB, Redis or workers.

Only performs HTTP GET probes and optional webhook notifications. Never restarts services.
"""
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlsplit


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.build_opener(NoRedirect).open(url, timeout=timeout) as response:
            body = response.read(8193)
            if response.status != 200 or len(body) > 8192:
                return False
            payload = json.loads(body)
            return isinstance(payload, dict) and payload.get("service") == "monitoring-backend" and payload.get("status") == "ok"
    except (OSError, ValueError, urllib.error.URLError):
        return False


@dataclass
class ProbeState:
    failures: int = 0
    successes: int = 0
    down: bool = False

    def observe(self, healthy: bool) -> str | None:
        self.failures = 0 if healthy else self.failures + 1
        self.successes = self.successes + 1 if healthy else 0
        if not self.down and self.failures >= 3:
            self.down = True
            return "MONITOR_UNAVAILABLE"
        if self.down and self.successes >= 2:
            self.down = False
            return "MONITOR_RECOVERED"
        return None


def validate_url(url: str, *, webhook: bool = False) -> None:
    parsed = urlsplit(url)
    if parsed.username or parsed.password or not parsed.hostname or parsed.scheme not in {"http", "https"}:
        raise ValueError("Use an HTTP(S) URL without embedded credentials")
    if webhook and parsed.scheme != "https":
        raise ValueError("External webhook must use HTTPS")


def notify(url: str, payload: dict) -> bool:
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
    for attempt in range(3):
        try:
            with urllib.request.build_opener(NoRedirect).open(request, timeout=3) as response:
                if 200 <= response.status < 300:
                    return True
        except (OSError, urllib.error.URLError):
            pass
        if attempt < 2:
            time.sleep(2 ** attempt)
    return False


def main() -> None:
    url = os.environ.get("WATCHDOG_TARGET_URL", "http://127.0.0.1:4000/health")
    webhook = os.environ.get("WATCHDOG_WEBHOOK_URL", "")
    validate_url(url)
    if webhook:
        validate_url(webhook, webhook=True)
    interval = max(1.0, float(os.environ.get("WATCHDOG_INTERVAL_SECONDS", "5")))
    state = ProbeState()
    print(json.dumps({"event": "WATCHDOG_STARTED", "intervalSeconds": interval}), flush=True)
    while True:
        started = time.monotonic()
        event = state.observe(probe(url))
        if event:
            payload = {"event": event, "timestamp": datetime.now(timezone.utc).isoformat(), "source": "external-watchdog"}
            print(json.dumps(payload), flush=True)
            if webhook and not notify(webhook, payload):
                print(json.dumps({"event": "WEBHOOK_DELIVERY_FAILED"}), flush=True)
        time.sleep(max(0.1, interval - (time.monotonic() - started)))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
