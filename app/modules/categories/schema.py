from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: Literal["income","expense"]
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str
    description: Optional[str] = None
    
class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes = True)

    @field_validator("type")
    @classmethod
    def traduzido_tipo(cls, value: str) -> str:
        mapeamento ={
            "income": "Receita",
            "expense": "Despesa"
        }

        return mapeamento.get(value, value)

 