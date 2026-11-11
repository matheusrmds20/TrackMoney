from fastapi.testclient import TestClient

from app.core.cookies import CSRF_COOKIE
from app.core.rate_limit import limiter
from app.core.security import create_csrf_token
from app.core.security_limits import reset

# IMPORTANTE: os testes ficam dentro do pacote `app/`, então `import app` resolve
# para o PACOTE `app` e sombreia a variável `app` daqui. Por isso importamos a
# instância FastAPI com outro nome.
from app.main import app as fastapi_app


def test_csrf_exempt_paths():
    limiter.reset()
    reset("wrong@example.com")
    client = TestClient(fastapi_app)

    assert client.get("/").status_code == 200

    res_login = client.post(
        "/auth/login", data={"username": "wrong@example.com", "password": "badpassword"}
    )
    assert res_login.status_code == 401

    res_register = client.post("/auth/register", json={"email": "bad", "password": "x"})
    assert res_register.status_code == 422  # chegou na validacao, nao no CSRF


def test_csrf_cookie_without_header_returns_403():
    client = TestClient(fastapi_app)
    client.cookies.set(CSRF_COOKIE, create_csrf_token())
    res = client.post("/auth/logout")
    assert res.status_code == 403
    assert res.json() == {"detail": "csrf"}


def test_csrf_mismatched_header_returns_403():
    client = TestClient(fastapi_app)
    client.cookies.set(CSRF_COOKIE, create_csrf_token())
    res = client.post("/auth/logout", headers={"X-CSRF-Token": "wrong-token"})
    assert res.status_code == 403
    assert res.json() == {"detail": "csrf"}


def test_csrf_unsigned_token_returns_403():
    client = TestClient(fastapi_app)
    unsigned = "just-a-random-string-without-valid-hmac"
    client.cookies.set(CSRF_COOKIE, unsigned)
    res = client.post("/auth/logout", headers={"X-CSRF-Token": unsigned})
    assert res.status_code == 403
    assert res.json() == {"detail": "csrf"}


def test_csrf_valid_token_allows_mutation():
    client = TestClient(fastapi_app)
    token = create_csrf_token()
    client.cookies.set(CSRF_COOKIE, token)
    res = client.post("/auth/logout", headers={"X-CSRF-Token": token})
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_bearer_bypasses_csrf():
    client = TestClient(fastapi_app)
    res = client.post("/auth/logout", headers={"Authorization": "Bearer some-token"})
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_refresh_is_csrf_exempt():
    """O refresh acontece quando o access expirou; nao pode exigir CSRF de sessao."""
    client = TestClient(fastapi_app)
    res = client.post("/auth/refresh")  # sem cookie de refresh -> 401, nao 403
    assert res.status_code == 401
    assert res.json() != {"detail": "csrf"}
