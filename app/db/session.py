from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # nunca loga SQL (nem hashed_password) em producao
    pool_pre_ping=True,           # descarta conexoes mortas do pooler (Supabase/Render)
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10,
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