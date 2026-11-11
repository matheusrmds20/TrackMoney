from datetime import datetime, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.refresh_token import RefreshTokenDB, RevokedAccessTokenDB


def decode_token(raw: str, expected_type: str) -> dict | None:
    try:
        payload = jwt.decode(raw, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != expected_type or not payload.get("jti") or not payload.get("sub"):
        return None
    return payload


def store_refresh_token(db: Session, payload: dict) -> None:
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    db.add(
        RefreshTokenDB(jti=payload["jti"], user_id=int(payload["sub"]), expires_at=expires_at)
    )
    db.commit()


def consume_refresh_token(db: Session, payload: dict) -> bool:
    token = db.query(RefreshTokenDB).filter(RefreshTokenDB.jti == payload["jti"]).first()
    if not token or token.revoked or token.user_id != int(payload["sub"]):
        return False
    token.revoked = True
    db.commit()
    return True


def revoke_refresh_token(db: Session, payload: dict) -> None:
    token = db.query(RefreshTokenDB).filter(RefreshTokenDB.jti == payload.get("jti")).first()
    if token:
        token.revoked = True
        db.commit()


def revoke_access_token(db: Session, payload: dict) -> None:
    if db.query(RevokedAccessTokenDB).filter(RevokedAccessTokenDB.jti == payload["jti"]).first():
        return
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    db.add(RevokedAccessTokenDB(jti=payload["jti"], expires_at=expires_at))
    db.commit()


def is_access_token_revoked(db: Session, jti: str) -> bool:
    revoked = (
        db.query(RevokedAccessTokenDB)
        .filter(RevokedAccessTokenDB.jti == jti)
        .first()
        is not None
    )
    return revoked


def revoke_all_user_tokens(db: Session, user_id: int) -> None:
    """Invalida todas as sessoes de um usuario (troca de senha, 2FA, incidente)."""
    db.query(RefreshTokenDB).filter(
        RefreshTokenDB.user_id == user_id, RefreshTokenDB.revoked.is_(False)
    ).update({RefreshTokenDB.revoked: True}, synchronize_session=False)
    db.commit()


def purge_expired_tokens(db: Session) -> dict[str, int]:
    """Politica de retencao: nada expirado/revogado fica guardado.

    Roda no startup (uma query por tabela): mantem a denylist pequena e evita
    que ela vire uma base de dados sensivel a longo prazo.
    """
    now = datetime.now(timezone.utc)

    expired_access = (
        db.query(RevokedAccessTokenDB)
        .filter(RevokedAccessTokenDB.expires_at < now)
        .delete(synchronize_session=False)
    )
    dead_refresh = (
        db.query(RefreshTokenDB)
        .filter((RefreshTokenDB.expires_at < now) | (RefreshTokenDB.revoked.is_(True)))
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"revoked_access_tokens": expired_access, "refresh_tokens": dead_refresh}
