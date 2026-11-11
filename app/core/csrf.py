import hashlib
import hmac

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.cookies import CSRF_COOKIE, CSRF_HEADER

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

CSRF_EXEMPT_PATHS = {
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/health",
    "/",
}


def sign(value: str) -> str:
    sig = hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()
    return f"{value}.{sig}"


def verify_signed(token: str) -> bool:
    try:
        value, sig = token.rsplit(".", 1)
    except ValueError:
        return False
    expected = hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS or request.url.path in CSRF_EXEMPT_PATHS:
            return await call_next(request)

        cookie = request.cookies.get(CSRF_COOKIE)
        header = request.headers.get(CSRF_HEADER)

        has_bearer = request.headers.get("authorization", "").lower().startswith("bearer ")


        if has_bearer or not cookie:
            return await call_next(request)

        if not header:
            return JSONResponse({"detail": "csrf"}, status_code=403)
        if not hmac.compare_digest(cookie, header):
            return JSONResponse({"detail": "csrf"}, status_code=403)
        if not verify_signed(cookie):
            return JSONResponse({"detail": "csrf"}, status_code=403)

        return await call_next(request)
