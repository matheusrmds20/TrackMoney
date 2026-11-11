"""Testes da Fase 6: refresh token rotativo, denylist de access token e cookies."""

from datetime import datetime, timedelta, timezone

from app.core.cookies import ACCESS_COOKIE, REFRESH_COOKIE
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.core.security_limits import reset
from app.core.token_store import purge_expired_tokens
from app.db.models.refresh_token import RefreshTokenDB, RevokedAccessTokenDB
from app.db.models.user import UserDB

PASSWORD = "senha-super-segura-123"  # noqa: S105 (credencial de teste)


def _create_user(db_session, email="sessao@example.com") -> UserDB:
    user = UserDB(email=email, hashed_password=hash_password(PASSWORD))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, email):
    reset(email)
    limiter.reset()
    return client.post(
        "/auth/login",
        data={"username": email, "password": PASSWORD},
    )


def test_login_sets_httponly_cookies_and_hides_token(client, db_session):
    user = _create_user(db_session)
    res = _login(client, user.email)
    assert res.status_code == 200

    raw = res.headers.get_list("set-cookie")
    access = next(c for c in raw if c.startswith(f"{ACCESS_COOKIE}="))
    refresh = next(c for c in raw if c.startswith(f"{REFRESH_COOKIE}="))

    assert "HttpOnly" in access and "HttpOnly" in refresh
    assert "SameSite=lax" in access
    assert "Path=/auth/refresh" in refresh

    body = res.json()
    assert "access_token" not in body  # nunca exposto ao JS
    assert body["token_type"] == "cookie"  # noqa: S105


def test_refresh_rotates_and_old_token_is_rejected(client, db_session):
    user = _create_user(db_session, "rotacao@example.com")
    assert _login(client, user.email).status_code == 200

    first_refresh = client.cookies.get(REFRESH_COOKIE)

    res = client.post("/auth/refresh")
    assert res.status_code == 200
    second_refresh = client.cookies.get(REFRESH_COOKIE)
    assert second_refresh and second_refresh != first_refresh

    # Replay do refresh antigo (cookie manual) -> recusado
    client.cookies.set(REFRESH_COOKIE, first_refresh, path="/auth/refresh")
    replay = client.post("/auth/refresh")
    assert replay.status_code == 401


def test_logout_revokes_tokens(client, db_session):
    user = _create_user(db_session, "logout@example.com")
    assert _login(client, user.email).status_code == 200

    access_before = client.cookies.get(ACCESS_COOKIE)
    res = client.post("/auth/logout", headers={"X-CSRF-Token": client.cookies.get("csrf_token")})
    assert res.status_code == 200

    # O access token antigo foi para a denylist
    assert (
        db_session.query(RevokedAccessTokenDB).count() == 1
    )
    assert db_session.query(RefreshTokenDB).filter(RefreshTokenDB.revoked.is_(True)).count() == 1

    # Uso do token revogado (via header Bearer) -> 401
    whoami = client.get("/auth/me", headers={"Authorization": f"Bearer {access_before}"})
    assert whoami.status_code == 401


def test_purge_expired_tokens(db_session):
    past = datetime.now(timezone.utc) - timedelta(days=1)
    future = datetime.now(timezone.utc) + timedelta(days=1)

    db_session.add_all(
        [
            RevokedAccessTokenDB(jti="expired", expires_at=past),
            RevokedAccessTokenDB(jti="valid", expires_at=future),
            RefreshTokenDB(jti="expired-r", user_id=1, expires_at=past),
        ]
    )
    db_session.commit()

    removed = purge_expired_tokens(db_session)
    assert removed["revoked_access_tokens"] == 1
    assert removed["refresh_tokens"] == 1

    remaining = {row.jti for row in db_session.query(RevokedAccessTokenDB).all()}
    assert remaining == {"valid"}


def test_token_type_confusion_is_rejected(client, db_session):
    """Um refresh token nao pode ser aceito como access token."""
    from app.core.security import create_refresh_token

    user = _create_user(db_session, "confusao@example.com")
    refresh = create_refresh_token(user.id)

    res = client.get("/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert res.status_code == 401
