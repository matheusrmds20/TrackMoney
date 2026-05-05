from app.db.models.trasactions import TransactionType
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime, timezone

class TrasactionBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    value: float
    description: Optional[str] = None
    type: TransactionType
    category_id: int
    transaction_date: Optional[datetime] = None


class TransactionCreate(TrasactionBase):
    @field_validator("title")
    def title_not_blanck(cls, v):
        if not v.strip():
            raise ValueError("O titulo nao pode estar vazio")
        return v
    
    @field_validator("transaction_date")
    def no_future_date(cls, v):
        if v > datetime.now(timezone.utc):
            raise ValueError("O tempo da transicao nao poder ser no futuro")
        return v

class TransactionUpdate(TrasactionBase):
    pass

class TransactionResponse(BaseModel):
    id: int
    title: str
    type: str

    model_config = ConfigDict(from_attributes=True)