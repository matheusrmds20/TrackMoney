from pydantic import BaseModel, ConfigDict, Field

class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str

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

 