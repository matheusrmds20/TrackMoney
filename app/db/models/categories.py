from sqlalchemy import Integer, String, Column, ForeignKey, UniqueConstraint, Enum, Boolean
from app.db.session import Base
from enum import Enum as PyEnum


class CategoryType(PyEnum):
    income = "income"
    expense = "expense"


class CategoryDB(Base):
    __tablename__ = "category"

    __table_args__ = (
    UniqueConstraint("name", "user_id"),
)

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    is_activated = Column(Boolean, default=True)
    type = Column(Enum(CategoryType, name="category_type"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))