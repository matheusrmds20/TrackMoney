from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=70)


class CreateUser(UserBase):
    pass


class LoginUser(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class MeResponse(UserResponse):
    pass
