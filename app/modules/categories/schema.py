from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str
    type: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes = True)

 