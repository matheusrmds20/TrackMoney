import time
from collections import defaultdict

_failures: dict[str, list[float]] = defaultdict(list)
WINDOW, MAX_FAILS = 900, 10


def register_failure(email: str) -> None:
    _failures[email.lower()].append(time.time())


def is_locked(email: str) -> bool:
    now = time.time()
    lst = [t for t in _failures[email.lower()] if now - t < WINDOW]
    _failures[email.lower()] = lst
    return len(lst) >= MAX_FAILS


def reset(email: str) -> None:
    _failures.pop(email.lower(), None)
