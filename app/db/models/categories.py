from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, String, UniqueConstraint

from app.db.session import Base


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
    description = Column(String, nullable=True)