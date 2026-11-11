import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("ledger.access")


def _client_ip(request: Request) -> str | None:
    """IP do cliente já resolvido pelo proxy (uvicorn --proxy-headers).

    Logamos só o IP — nunca corpo, query string ou cookies (PII/segredos).
    """
    return request.client.host if request.client else None


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        logger.info(
            "request_completed",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "method": request.method,
                "path": request.url.path,  # sem querystring de propósito
                "status_code": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                "ip": _client_ip(request),
            },
        )
        return response
