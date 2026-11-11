# ruff: noqa: E402  (env vars precisam ser setadas antes dos imports do app)
import os
import tempfile

# Isola a suite do banco real (Supabase) ANTES de importar qualquer coisa do app.
# Sem isso, `app.main` cria engine apontando para producao e o TestClient roda
# com o engine global (foi o que quebrou os testes de rate limit/CSRF).
_TMP_DB = os.path.join(tempfile.mkdtemp(prefix="ledger-tests-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ["ENV"] = "development"
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["RATE_LIMIT_STORAGE_URI"] = "memory://"
os.environ["ENABLE_DOCS"] = "false"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only-please-ignore"  # noqa: S105

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.auth import get_current_user
from app.core.cookies import CSRF_COOKIE, CSRF_HEADER
from app.core.rate_limit import limiter
from app.core.security import create_csrf_token
from app.db.models.trasactions import TransactionsDB
from app.db.session import Base, get_db
from app.main import fastapi_app

SQLALCHEMY_DATABASE_URL = os.environ["DATABASE_URL"]

# Garante que TODOS os models estejam registrados em Base.metadata.
import app.db.models.categories  # noqa: E402,F401
import app.db.models.refresh_token  # noqa: E402,F401
import app.db.models.trasactions  # noqa: E402,F401
import app.db.models.user  # noqa: E402,F401


@pytest.fixture
def db_session():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def default_category(db_session):
    from app.db.models.categories import CategoryDB

    category = CategoryDB(name="salario", type="income")

    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture(autouse=True)
def clean_db(db_session):
    yield
    db_session.query(TransactionsDB).delete()
    db_session.commit()


@pytest.fixture()
def client(db_session):
    def _get_test_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _get_test_db

    with TestClient(fastapi_app) as m:
        yield m

    fastapi_app.dependency_overrides.clear()


class MockUser:
    id = 1
    email = "teste@example.com"


@pytest.fixture()
def auth_client(client):
    """Cliente autenticado com cookie CSRF valido (double-submit).

    O override de get_current_user cobre a autenticacao; o cookie + header
    CSRF cobrem o CSRFMiddleware, que roda antes das dependencias.
    """
    fastapi_app.dependency_overrides[get_current_user] = lambda: MockUser()

    csrf = create_csrf_token()
    client.cookies.set(CSRF_COOKIE, csrf)
    client.headers[CSRF_HEADER] = csrf

    yield client

    if get_current_user in fastapi_app.dependency_overrides:
        del fastapi_app.dependency_overrides[get_current_user]


@pytest.fixture()
def default_transaction(db_session, default_category):
    def _create(
        title="Teste",
        value=100,
        type="income",
        user_id=1,
        category_id=default_category.id,
    ):
        tx = TransactionsDB(
            title=title,
            value=value,
            type=type,
            user_id=user_id,
            category_id=default_category.id,
        )

        db_session.add(tx)
        db_session.commit()
        db_session.refresh(tx)
        return tx

    return _create


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()
    yield
    limiter.reset()
