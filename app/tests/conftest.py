import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db, Base
from app.db.models.trasactions import TransactionsDB
from app.core.auth import get_current_user




SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db" 

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///./test.db")
    TestingSession =  sessionmaker(bind=engine)
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
    
    category = CategoryDB(name = "salario", type = "income")

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

    app.dependency_overrides[get_db] = _get_test_db

    with TestClient(app) as m:
        yield m

    app.dependency_overrides.clear()


class MockUser:
    id = 1
    email = "teste@example.com"


@pytest.fixture()
def auth_client(client):

    app.dependency_overrides[get_current_user] = lambda: MockUser()

    yield client

    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

@pytest.fixture()
def default_transaction(db_session, default_category):
    def _create(title="Teste", value=100, type="income", user_id=1, category_id= default_category.id):
        tx = TransactionsDB(
            title = title,
            value = value,
            type = type,
            user_id = user_id,
            category_id  = default_category.id
        )

        db_session.add(tx)
        db_session.commit()
        db_session.refresh(tx)
        return tx
    return _create
        

