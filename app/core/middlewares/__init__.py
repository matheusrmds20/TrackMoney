from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.csrf import CSRFMiddleware
from app.core.middlewares.access_log import AccessLogMiddleware
from app.core.middlewares.body_limit import BodyLimitMiddleware
from app.core.middlewares.https_redirect import HTTPSRedirectMiddleware
from app.core.middlewares.request_id import RequestIdMiddleware
from app.core.middlewares.security_headers import SecurityHeadersMiddleware
from app.core.rate_limit import init_rate_limit


def register_middlewares(app: FastAPI) -> None:
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(CSRFMiddleware)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

    if settings.ENV == "production" and settings.FORCE_HTTPS:
        app.add_middleware(HTTPSRedirectMiddleware)

    init_rate_limit(app)   # limiter + exception handler + headers X-RateLimit-*

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
        expose_headers=["X-Request-ID", "Retry-After"],
        max_age=600,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AccessLogMiddleware)
    app.add_middleware(RequestIdMiddleware)

    from app.core.logging import install_security_signal_alerting

    install_security_signal_alerting()
