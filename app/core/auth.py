from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.cookies import ACCESS_COOKIE
from app.core.token_store import decode_token, is_access_token_revoked
from app.db.models.user import UserDB
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _extract_token(request: Request, header_token: str | None) -> str | None:
    if header_token:
        return header_token
    return request.cookies.get(ACCESS_COOKIE)


def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UserDB:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    raw = _extract_token(request, token)
    if not raw:
        raise credentials_error

    payload = decode_token(raw, "access")
    if payload is None:
        raise credentials_error
    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise credentials_error

    if user_id is None:
        raise credentials_error

    if is_access_token_revoked(db, payload["jti"]):
        raise credentials_error

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise credentials_error
    return user
