from fastapi.testclient import TestClient

from app.core.middlewares.body_limit import MAX_BODY
from app.core.security_limits import reset
from app.main import app as fastapi_app


def test_rate_limit_login():
    reset("rate_test@example.com")
    client = TestClient(fastapi_app)

    for _ in range(5):
        res = client.post(
            "/auth/login",
            data={"username": "rate_test@example.com", "password": "wrongpassword"},
        )
        assert res.status_code == 401

    res_limit = client.post(
        "/auth/login",
        data={"username": "rate_test@example.com", "password": "wrongpassword"},
    )
    assert res_limit.status_code == 429
    assert "Retry-After" in res_limit.headers


def test_health_is_exempt():
    client = TestClient(fastapi_app)
    for _ in range(10):
        assert client.get("/health").status_code == 200


def test_request_id_header():
    client = TestClient(fastapi_app)
    res = client.get("/")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers


def test_security_headers_present():
    client = TestClient(fastapi_app)
    res = client.get("/")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "no-referrer"
    assert "default-src 'none'" in res.headers.get("Content-Security-Policy", "")
    assert "Server" not in res.headers


def test_body_limit():
    client = TestClient(fastapi_app)
    too_large = "x" * (MAX_BODY + 10)
    res = client.post(
        "/auth/register",
        content=too_large,
        headers={"Content-Type": "application/json", "Content-Length": str(len(too_large))},
    )
    assert res.status_code == 413
    assert res.json() == {"detail": "Payload muito grande"}


def test_trusted_host_blocks_unauthorized():
    client = TestClient(fastapi_app)
    assert client.get("/", headers={"Host": "evil.com"}).status_code == 400
