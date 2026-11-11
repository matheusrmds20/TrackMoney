import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from app.core.config import settings

logger = logging.getLogger("ledger.ratelimit")


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def login_key(request: Request) -> str:
    return client_ip(request)


def user_key(request: Request) -> str:
    user = getattr(request.state, "user", None)
    return f"user:{user.id}" if user else f"ip:{client_ip(request)}"


limiter = Limiter(
    key_func=client_ip,
    storage_uri=settings.RATE_LIMIT_STORAGE_URI,
    enabled=settings.RATE_LIMIT_ENABLED,
    default_limits=["200/minute"],
    headers_enabled=False,
    strategy="fixed-window",
)


def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after = getattr(exc.detail, "retry_after", 60) if hasattr(exc, "detail") else 60
    return JSONResponse(
        {"detail": "Muitas requisicoes. Tente novamente em instantes."},
        status_code=429,
        headers={"Retry-After": str(retry_after)},
    )


def _enforce_limits(request: Request) -> None:
    """Avalia limite global (default_limits) quando nenhum @limiter.limit rodou.

    O decorator do SlowAPI ja avalia a rota; aqui cobrimos /health, /docs, 404s
    e qualquer rota sem decorator. Sem isso `default_limits` nunca vale.
    """
    if not limiter.enabled or getattr(request.state, "view_rate_limit", None) is not None:
        return
    if any(fn() for fn in limiter._request_filters):
        return
    limiter._check_request_limit(request, None, in_middleware=True)


def init_rate_limit(app) -> None:
    """Registra o limiter, o handler de 429 e os headers X-RateLimit-*.

    Notas de implementacao (por que nao usamos o atalho do SlowAPI):
    * `headers_enabled=True` exige um parametro `response: Response` em TODA
      rota decorada com @limiter.limit e levanta Exception quando falta;
    * sem `SlowAPIMiddleware` os `default_limits` nao sao aplicados.
    Por isso: headers_enabled=False + injecao manual dos headers + checagem do
    limite global neste middleware.
    """
    from slowapi.errors import RateLimitExceeded as _RLExceeded
    from starlette.middleware.base import BaseHTTPMiddleware

    app.state.limiter = limiter
    app.add_exception_handler(_RLExceeded, rate_limit_handler)

    class RateLimitMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            try:
                _enforce_limits(request)
            except _RLExceeded as exc:
                return rate_limit_handler(request, exc)

            response = await call_next(request)

            view_limit = getattr(request.state, "view_rate_limit", None)
            if limiter.enabled and view_limit is not None:
                try:
                    limit_item, keys = view_limit
                    window_reset, remaining = limiter.limiter.get_window_stats(limit_item, *keys)
                    # SecurityHeadersMiddleware (mais externo) copia para a resposta.
                    request.state.rl_X_RateLimit_Limit = str(limit_item.amount)
                    request.state.rl_X_RateLimit_Remaining = str(remaining)
                    request.state.rl_X_RateLimit_Reset = str(int(window_reset))
                except Exception:  # storage indisponivel: nao quebra a request
                    logger.debug("rate_limit_headers_failed", exc_info=True)
            return response

    app.add_middleware(RateLimitMiddleware)
