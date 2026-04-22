from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm  import relationship 
from sqlalchemy.sql import func
from app.db.session import Base


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String,nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship("TransactionsDB", back_populates="proprietario")