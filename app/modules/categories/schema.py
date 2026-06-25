from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Literal

class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: Literal["income","expense"]

class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes = True)

    @field_validator("type")
    @classmethod
    def traduzido_tipo(cls, value: str) -> str:
        mapeamento ={
            "income": "Receita",
            "expense": "Despesa"
        }

        return mapeamento.get(value, value)

 