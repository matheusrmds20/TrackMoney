from fastapi import Response

from app.core.config import settings

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"

_ACCESS_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
_REFRESH_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
_CSRF_MAX_AGE = 60 * 60 * 8


def set_access_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=token,
        max_age=_ACCESS_MAX_AGE,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path=settings.COOKIE_PATH,
    )


def set_refresh_cookie(response: Response, token: str) -> None:
    """Restrict the refresh credential to its single-purpose endpoint."""
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=_REFRESH_MAX_AGE,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/auth/refresh",
    )


def set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE,
        value=token,
        max_age=_CSRF_MAX_AGE,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path=settings.COOKIE_PATH,
    )


def clear_auth_cookies(response: Response) -> None:
    cookies = (
        (ACCESS_COOKIE, settings.COOKIE_PATH),
        (REFRESH_COOKIE, "/auth/refresh"),
        (CSRF_COOKIE, settings.COOKIE_PATH),
    )
    for name, path in cookies:
        response.delete_cookie(
            name,
            domain=settings.COOKIE_DOMAIN,
            path=path,
            samesite=settings.COOKIE_SAMESITE,
            secure=settings.COOKIE_SECURE,
        )
