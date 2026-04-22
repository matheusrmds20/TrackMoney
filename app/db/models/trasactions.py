from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from enum import Enum as PyEnum


class TransactionType(PyEnum):
    income = "income"
    expense = "expense"


class TransactionsDB(Base):
    __tablename__ = "trasactions"


    id = Column(Integer, primary_key=True)
    title =  Column(String, nullable=False)
    value = Column(Numeric(10,2), nullable=False)
    type = Column(Enum(TransactionType, name="transaction_type"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer,ForeignKey("category.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    transaction_date = Column(DateTime, nullable=False, default=func.now())

    proprietario = relationship("UserDB", back_populates="transactions")