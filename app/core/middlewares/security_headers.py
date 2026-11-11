from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings

BASE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
}
HSTS = "max-age=31536000; includeSubDomains; preload"

DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")
DOCS_CSP = (
    "default-src 'self'; img-src 'self' data: https://fastapi.tiangolo.com; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data:"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        for k, v in BASE_HEADERS.items():
            response.headers.setdefault(k, v)

        # Headers de rate limit (injetados em app/core/rate_limit.py).
        rl_headers = (
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Retry-After",
        )
        for header in rl_headers:
            value = getattr(request.state, "rl_" + header.replace("-", "_"), None)
            if value is not None and header not in response.headers:
                response.headers[header] = str(value)

        if settings.ENV == "production" and settings.COOKIE_SECURE:
            response.headers.setdefault("Strict-Transport-Security", HSTS)

        if request.url.path in DOCS_PATHS:
            response.headers["Content-Security-Policy"] = DOCS_CSP

        if request.url.path.startswith(("/auth", "/report", "/transactions", "/category")):
            response.headers["Cache-Control"] = "no-store"
        else:
            response.headers.setdefault("Cache-Control", "no-store")

        if "Server" in response.headers:
            del response.headers["Server"]
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]

        return response
