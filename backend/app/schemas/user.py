from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    nickname: str = Field(..., min_length=2, max_length=30)
    region_id: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=100)
