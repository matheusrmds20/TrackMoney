from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    settings.DATABASE_URL, echo=True
)

Base = declarative_base()

Session = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()