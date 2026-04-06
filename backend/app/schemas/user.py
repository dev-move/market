import re

from pydantic import BaseModel, EmailStr, Field, model_validator


_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{4,20}$")


class UserSignup(BaseModel):
    username: str = Field(..., min_length=4, max_length=20)
    password: str = Field(..., min_length=8, max_length=100)
    password_confirm: str = Field(..., min_length=8, max_length=100)
    email: EmailStr
    nickname: str = Field(..., min_length=2, max_length=30)
    full_name: str = Field(..., min_length=2, max_length=30)
    region_id: int = Field(..., ge=1)

    @model_validator(mode="after")
    def validate_username_pattern(self) -> "UserSignup":
        if not _USERNAME_PATTERN.match(self.username):
            raise ValueError("아이디는 영문, 숫자, 밑줄(_)만 4~20자로 입력해주세요")
        return self

    @model_validator(mode="after")
    def passwords_match(self) -> "UserSignup":
        if self.password != self.password_confirm:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return self


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=30)
    password: str = Field(..., min_length=1, max_length=100)


class UserRecoverUsername(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=30)


class UserRecoverPassword(BaseModel):
    username: str = Field(..., min_length=1, max_length=30)
    full_name: str = Field(..., min_length=2, max_length=30)
    email: EmailStr
    new_password: str = Field(..., min_length=8, max_length=100)
    new_password_confirm: str = Field(..., min_length=8, max_length=100)

    @model_validator(mode="after")
    def new_passwords_match(self) -> "UserRecoverPassword":
        if self.new_password != self.new_password_confirm:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return self
