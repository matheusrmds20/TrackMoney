import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db, Base


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