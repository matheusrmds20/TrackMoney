from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

MAX_BODY = 1 * 1024 * 1024


class BodyLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cl = request.headers.get("content-length")
        if cl is not None:
            try:
                if int(cl) > MAX_BODY:
                    return JSONResponse({"detail": "Payload muito grande"}, status_code=413)
            except ValueError:
                return JSONResponse({"detail": "Content-Length invalido"}, status_code=400)
        return await call_next(request)
