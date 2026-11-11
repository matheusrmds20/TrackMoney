import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.csrf import sign

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"), 
        hashed_password.encode("utf-8")
    )


_DUMMY_HASH: str | None = None


def _dummy_hash() -> str:
    """Hash descartavel (gerado uma vez) para igualar o custo do bcrypt."""
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = hash_password(secrets.token_urlsafe(16))
    return _DUMMY_HASH


def verify_password_or_dummy(password: str, hashed_password: str | None) -> bool:
    """Gasta o mesmo tempo de bcrypt com ou sem usuario -> evita user enumeration."""
    if hashed_password is None:
        bcrypt.checkpw(password.encode("utf-8"), _dummy_hash().encode("utf-8"))
        return False
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_token(data: dict, expires_minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {**data, "iat": now, "exp": expire, "type": "access", "jti": uuid4().hex}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    """Create a long-lived token that is only accepted by /auth/refresh."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expire,
        "type": "refresh",
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_csrf_token() -> str:
    return sign(secrets.token_urlsafe(32))
