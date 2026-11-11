import json
import logging
import sys
import threading
import time

from app.core.config import settings

SENSITIVE_FIELDS = {
    "password",
    "hashed_password",
    "access_token",
    "refresh_token",
    "csrf_token",
    "authorization",
    "cookie",
}
SENSITIVE_QUERY = {"token", "access_token", "refresh_token", "csrf_token"}


class JsonFormatter(logging.Formatter):
    """Small dependency-free JSON formatter suitable for container logs."""

    def format(self, record: logging.LogRecord) -> str:
        event = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in (
            "request_id",
            "method",
            "path",
            "status_code",
            "duration_ms",
            "ip",
            "event",
            "count",
            "window_seconds",
        ):
            value = getattr(record, field, None)
            if value is not None:
                event[field] = value
        return json.dumps(event, ensure_ascii=False)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(settings.LOG_LEVEL.upper())


def scrub(data: dict) -> dict:
    """Remove segredos antes de logar (defesa em profundidade contra vazamento de PII)."""
    return {
        k: ("***" if k.lower() in SENSITIVE_FIELDS else v)
        for k, v in data.items()
    }



class SecuritySignalMonitor:
    WATCHED = {401: "auth_failures", 403: "forbidden", 429: "rate_limited"}

    def __init__(self, window_seconds: int = 300, threshold: int = 50) -> None:
        # Em desenvolvimento o ruido (login testando) dispara o alerta atoa.
        self.enabled = settings.ENV == "production"
        self.window_seconds = window_seconds
        self.threshold = threshold
        self._guard = threading.Lock()
        self._counts: dict[tuple[int, str], int] = {}
        self._last_flush = time.monotonic()
        self._logger = logging.getLogger("ledger.security")

    def record(self, status_code: int, path: str) -> None:
        if not self.enabled or status_code not in self.WATCHED:
            return
        with self._guard:
            key = (status_code, path)
            self._counts[key] = self._counts.get(key, 0) + 1
            if time.monotonic() - self._last_flush >= self.window_seconds:
                self._flush_locked()

    def _flush_locked(self) -> None:
        self._last_flush = time.monotonic()
        for (status_code, path), count in self._counts.items():
            if count >= self.threshold:
                self._logger.warning(
                    "security_signal",
                    extra={
                        "event": self.WATCHED[status_code],
                        "status_code": status_code,
                        "path": path,
                        "count": count,
                        "window_seconds": self.window_seconds,
                    },
                )
        self._counts.clear()


security_signals = SecuritySignalMonitor()
_installed = False


def install_security_signal_alerting() -> None:
    """Alimenta o monitor a partir do logger de acesso (chamado uma vez)."""
    global _installed
    if _installed:
        return
    _installed = True

    class SecuritySignalFilter(logging.Filter):
        def filter(self, record: logging.LogRecord) -> bool:
            status = getattr(record, "status_code", None)
            path = getattr(record, "path", None)
            if isinstance(status, int) and isinstance(path, str):
                security_signals.record(status, path)
            return True

    logging.getLogger("ledger.access").addFilter(SecuritySignalFilter())
